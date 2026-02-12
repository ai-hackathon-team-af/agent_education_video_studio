"""Video generation Celery tasks"""
from celery import Task
from typing import Dict, Any, List, Optional
import logging
import os
import json
from threading import Thread
from pathlib import Path

from app.tasks.celery_app import celery_app
from app.services.video.video_generator import VideoGenerator
from app.core.asset_generators.voice_generator import VoiceGenerator
from app.models.scripts.common import VideoSection
from app.utils.files import FileManager

logger = logging.getLogger(__name__)


def _analyze_script_optimizations(script_data: Dict[str, Any], result_holder: Dict[str, Any]) -> None:
    """台本を分析してAI最適化ポイントを生成する（別スレッドで実行）"""
    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        from app.utils.llm_factory import create_llm_from_model_config
        from app.config.models import get_default_model_config
        from app.config.app import PROMPTS_DIR

        # プロンプトテンプレート読み込み
        prompt_path = PROMPTS_DIR / "comedy" / "optimization_analysis.md"
        prompt_template = prompt_path.read_text(encoding="utf-8")

        # 台本の要約を作成
        theme = script_data.get("theme", "不明")
        sections = script_data.get("sections", [])
        sections_summary = ", ".join(
            s.get("section_name", "不明") for s in sections
        )

        # 台本内容をテキスト化
        script_lines = []
        for section in sections:
            script_lines.append(f"\n### {section.get('section_name', '')}")
            for seg in section.get("segments", []):
                speaker = seg.get("speaker", "?")
                text = seg.get("text", "")
                script_lines.append(f"  {speaker}: {text}")
        script_content = "\n".join(script_lines)

        # プロンプト生成
        prompt = prompt_template.format(
            theme=theme,
            sections_summary=sections_summary,
            script_content=script_content,
        )

        # LLM呼び出し
        model_config = get_default_model_config()
        llm = create_llm_from_model_config(model_config, temperature=0.3)
        messages = [
            SystemMessage(content="あなたは教育動画の品質分析の専門家です。必ずJSON配列のみを出力してください。"),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)

        # JSON解析
        content = response.content.strip()
        # ```json ... ``` のマークダウンブロックを除去
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        points = json.loads(content)
        if isinstance(points, list) and len(points) > 0:
            result_holder["points"] = points[:4]  # 最大4個
            logger.info(f"台本分析完了: {len(result_holder['points'])}個のポイント生成")
        else:
            logger.warning("台本分析: 有効なポイントが生成されませんでした")

    except Exception as e:
        logger.warning(f"台本分析エラー（動画生成には影響なし）: {e}")


class VideoGenerationTask(Task):
    """動画生成タスクの基底クラス"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """タスク失敗時の処理"""
        logger.error(f"動画生成タスク失敗 (task_id={task_id}): {exc}")
        super().on_failure(exc, task_id, args, kwargs, einfo)
    
    def on_success(self, retval, task_id, args, kwargs):
        """タスク成功時の処理"""
        logger.info(f"動画生成タスク成功 (task_id={task_id})")
        super().on_success(retval, task_id, args, kwargs)


@celery_app.task(bind=True, base=VideoGenerationTask, name='app.tasks.generate_video')
def generate_video_task(
    self,
    conversations: List[Dict[str, Any]],
    enable_subtitles: bool = True,
    conversation_mode: str = "duo",
    sections: Optional[List[Dict[str, Any]]] = None,
    speed: Optional[float] = None,
    pitch: Optional[float] = None,
    intonation: Optional[float] = None,
    theme: Optional[str] = None,
    script_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    動画生成タスク

    Args:
        conversations: 会話リスト
        enable_subtitles: 字幕を有効にするか
        conversation_mode: 会話モード
        sections: セクション情報
        speed: 話速
        pitch: 音高
        intonation: 抑揚
        theme: スクリプトのテーマ（背景選択に使用）
        script_data: 台本データ（背景選択に使用）

    Returns:
        生成結果
    """
    try:
        logger.info(f"動画生成タスク開始 (task_id={self.request.id})")
        logger.info(f"会話数={len(conversations)}")

        # 台本分析を並列で開始
        optimization_result: Dict[str, Any] = {}
        analysis_thread = None
        if script_data:
            analysis_thread = Thread(
                target=_analyze_script_optimizations,
                args=(script_data, optimization_result),
                daemon=True,
            )
            analysis_thread.start()
            logger.info("台本分析スレッド開始（動画生成と並列実行）")

        # 進捗更新: 音声生成開始
        self.update_state(
            state='PROGRESS',
            meta={'progress': 0.1, 'message': '音声を生成中...'}
        )
        
        # 音声生成
        voice_generator = VoiceGenerator()
        audio_file_list = None
        try:
            audio_file_list = voice_generator.generate_conversation_voices(
                conversations=conversations,
                speed=speed,
                pitch=pitch,
                intonation=intonation
            )

            if not audio_file_list:
                raise ValueError("音声生成に失敗しました")

            logger.info(
                f"音声生成完了: "
                f"会話数={len(conversations)}, "
                f"音声ファイル数={len(audio_file_list)}"
            )
        except Exception as e:
            # 音声生成失敗時は既に生成されたファイルがあれば削除
            if audio_file_list:
                try:
                    FileManager.cleanup_audio_files(audio_file_list)
                except Exception:
                    pass
            raise
        
        # 進捗更新: 動画生成開始
        self.update_state(
            state='PROGRESS',
            meta={'progress': 0.4, 'message': '動画を生成中...'}
        )
        
        # セクション情報の変換
        video_sections = None
        if sections:
            from app.models.scripts.common import VideoSection
            video_sections = [VideoSection(**section) for section in sections]
            total_segments = sum(len(section.segments) for section in video_sections)
            logger.info(
                f"セクション情報変換完了: "
                f"セクション数={len(video_sections)}, "
                f"総セグメント数={total_segments}, "
                f"音声ファイル数={len(audio_file_list)}"
            )
        
        # 動画生成
        video_generator = VideoGenerator()
        
        def progress_callback(progress: float):
            """進捗コールバック"""
            self.update_state(
                state='PROGRESS',
                meta={
                    'progress': 0.4 + (progress * 0.5),  # 40%から90%まで
                    'message': f'動画を生成中... ({int(progress * 100)}%)'
                }
            )
        
        output_path = video_generator.generate_conversation_video(
            conversations=conversations,
            audio_file_list=audio_file_list,
            enable_subtitles=enable_subtitles,
            conversation_mode=conversation_mode,
            sections=video_sections,
            progress_callback=progress_callback,
            theme=theme,
            script_data=script_data
        )
        
        if not output_path or not os.path.exists(output_path):
            raise ValueError("動画生成に失敗しました")
        
        # 進捗更新: 完了
        self.update_state(
            state='PROGRESS',
            meta={'progress': 1.0, 'message': '動画生成完了！'}
        )
        
        video_generator.cleanup()
        
        try:
            FileManager.cleanup_temp_files()
        except Exception as cleanup_error:
            logger.warning(f"Failed to cleanup temp files: {cleanup_error}")
        
        # 台本分析スレッドの完了を待機
        if analysis_thread is not None:
            analysis_thread.join(timeout=60)
            logger.info(f"台本分析スレッド完了: {len(optimization_result.get('points', []))}個のポイント")

        logger.info(f"動画生成タスク完了 (task_id={self.request.id}): {output_path}")

        # ファイル名を抽出してAPIパスを生成
        filename = os.path.basename(output_path)
        api_video_path = f"/outputs/{filename}"

        return {
            'status': 'completed',
            'video_path': api_video_path,
            'message': '動画生成が完了しました',
            'ai_optimizations': optimization_result.get('points', []),
        }
        
    except Exception as e:
        logger.error(f"動画生成タスクエラー (task_id={self.request.id}): {str(e)}", exc_info=True)
        # エラー時も音声ファイルをクリーンアップ
        if 'audio_file_list' in locals() and audio_file_list:
            try:
                FileManager.cleanup_audio_files(audio_file_list)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup audio files on task error: {cleanup_error}")
        # Celeryの例外情報を正しく設定
        self.update_state(
            state='FAILURE',
            meta={
                'error': str(e),
                'error_type': type(e).__name__,
                'message': '動画生成に失敗しました'
            }
        )
        # 元の例外をそのまま再発生させる
        raise


@celery_app.task(bind=True, name='app.tasks.generate_voice')
def generate_voice_task(
    self,
    text: str,
    speaker: str = "zundamon",
    speed: float = 1.0,
    pitch: float = 0.0,
    intonation: float = 1.0
) -> Dict[str, Any]:
    """
    音声生成タスク
    
    Args:
        text: 読み上げテキスト
        speaker: 話者名
        speed: 話速
        pitch: 音高
        intonation: 抑揚
    
    Returns:
        生成結果
    """
    try:
        logger.info(f"音声生成タスク開始 (task_id={self.request.id})")
        
        voice_generator = VoiceGenerator()
        audio_path = voice_generator.generate_voice(
            text=text,
            speaker=speaker,
            speed=speed,
            pitch=pitch,
            intonation=intonation
        )
        
        if not audio_path or not os.path.exists(audio_path):
            raise ValueError("音声生成に失敗しました")
        
        logger.info(f"音声生成タスク完了 (task_id={self.request.id}): {audio_path}")
        
        return {
            'status': 'completed',
            'audio_path': audio_path,
            'message': '音声生成が完了しました'
        }
        
    except Exception as e:
        logger.error(f"音声生成タスクエラー (task_id={self.request.id}): {str(e)}", exc_info=True)
        raise
