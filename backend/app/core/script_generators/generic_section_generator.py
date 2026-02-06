"""汎用セクションジェネレーター（両モード共通）"""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from pydantic import ValidationError

from app.models.script_models import VideoSection, SectionDefinition, ScriptMode
from app.config.resource_config.bgm_library import (
    get_section_bgm,
    format_bgm_choices_for_prompt,
    validate_bgm_id,
    get_bgm_track,
)
from app.core.script_generators.section_context import SectionContext
from app.core.script_generators.context.section_context_builder import build_context_text
from app.utils.logger import get_logger

logger = get_logger(__name__)


class GenericSectionGenerator:
    """汎用セクション生成クラス（両モード対応）"""

    def __init__(self, mode: ScriptMode):
        """
        Args:
            mode: 生成モード（FOOD or COMEDY）
        """
        self.mode = mode
        self.section_prompt_file = Path(
            f"app/prompts/{mode.value}/section_generation.md"
        )

    def load_section_prompt(self) -> str:
        """セクション生成プロンプトを読み込む"""
        try:
            if not self.section_prompt_file.exists():
                raise FileNotFoundError(
                    f"セクションプロンプトファイルが見つかりません: {self.section_prompt_file}"
                )

            with open(self.section_prompt_file, "r", encoding="utf-8") as f:
                return f.read().strip()

        except Exception as e:
            logger.error(f"セクションプロンプト読み込みエラー: {str(e)}")
            raise

    def build_context_text(self, context: SectionContext) -> str:
        """コンテキスト情報をテキスト化する"""
        return build_context_text(context, self.mode)

    def _fix_json_quotes(self, text: str) -> str:
        """JSON文字列内の未エスケープされた二重引用符を修正する"""
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE)
        text = text.strip()

        result = []
        i = 0
        in_string = False
        escaped = False

        while i < len(text):
            char = text[i]

            if escaped:
                result.append(char)
                escaped = False
            elif char == "\\":
                result.append(char)
                escaped = True
            elif char == '"':
                if not in_string:
                    in_string = True
                    result.append(char)
                else:
                    if i + 1 < len(text):
                        next_char = text[i + 1]
                        if next_char in [",", "}", "]", ":", " ", "\t", "\n", "\r"]:
                            in_string = False
                            result.append(char)
                        else:
                            result.append('\\"')
                    else:
                        in_string = False
                        result.append(char)
            else:
                result.append(char)

            i += 1

        return "".join(result)

    def _parse_with_retry(
        self, parser: PydanticOutputParser, llm_response: Any, max_retries: int = 2
    ) -> Any:
        """パースをリトライ付きで実行する"""
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                if attempt == 0:
                    return parser.invoke(llm_response)
                else:
                    if hasattr(llm_response, "content"):
                        content = llm_response.content
                    else:
                        content = str(llm_response)

                    logger.warning(
                        f"JSONパースエラー、修正を試みます (試行 {attempt + 1}/{max_retries + 1})"
                    )
                    fixed_content = self._fix_json_quotes(content)
                    fixed_response = AIMessage(content=fixed_content)
                    return parser.invoke(fixed_response)

            except (OutputParserException, json.JSONDecodeError, ValueError, ValidationError) as e:
                last_error = e
                if attempt < max_retries:
                    logger.warning(f"パースエラー (試行 {attempt + 1}): {str(e)[:200]}")
                    continue
                else:
                    logger.error(f"パースエラー: 最大試行回数に達しました")
                    raise

        if last_error:
            raise last_error
        raise ValueError("パースに失敗しました")

    def generate(self, context: SectionContext, llm: Any) -> VideoSection:
        """セクションを生成する

        Args:
            context: セクションコンテキスト
            llm: LLMインスタンス

        Returns:
            VideoSection: 生成されたセクション
        """
        logger.info(
            f"セクション生成開始 ({self.mode.value}): {context.section_definition.section_name} "
            f"({context.section_definition.min_lines}-{context.section_definition.max_lines}セリフ)"
        )

        try:
            section_prompt_template = self.load_section_prompt()
            context_text = self.build_context_text(context)

            parser = PydanticOutputParser(pydantic_object=VideoSection)
            format_instructions = parser.get_format_instructions()

            # Comedyモードの場合、BGM選択肢情報を追加
            bgm_info = ""
            if self.mode == ScriptMode.COMEDY:
                bgm_choices = format_bgm_choices_for_prompt()
                bgm_info = f"\n\n## {bgm_choices}\n"

            # プロンプト構築
            full_prompt = f"""
{section_prompt_template}
{bgm_info}
---

{context_text}

## 参考情報
{context.reference_information}

## 出力形式

{format_instructions}
"""

            # システムメッセージ（教育動画用）
            system_message = "あなたは、教育動画の台本を作成する塾講師です。分かりやすく楽しい授業形式の会話を生成するプロフェッショナルです。生徒の理解を最優先にしてください。重要: 必ず日本語のみで出力してください。英語やヒンディー語など他言語の文字は絶対に使用しないでください。"

            # LLMを直接呼び出す
            messages = [
                SystemMessage(content=system_message),
                HumanMessage(content=full_prompt),
            ]

            logger.info(f"{context.section_definition.section_name} をLLMで生成中...")
            llm_response = llm.invoke(messages)

            # LLMの応答内のタイポを修正（text_for_voivevox → text_for_voicevox）
            if isinstance(llm_response.content, str):
                llm_response.content = llm_response.content.replace(
                    "text_for_voivevox", "text_for_voicevox"
                )
                llm_response.content = llm_response.content.replace(
                    '"text_for_voivevox"', '"text_for_voicevox"'
                )

            # LLMの応答をパース（リトライ付き）
            section = self._parse_with_retry(parser, llm_response)

            # セクションキーを設定
            section.section_key = context.section_definition.section_key

            # BGM設定
            if self.mode == ScriptMode.COMEDY:
                # Comedyモード: LLMが出力したBGMを使用（動的選択）
                validated_bgm_id = validate_bgm_id(section.bgm_id)
                section.bgm_id = validated_bgm_id

                # 音量のバリデーション
                if not (0.0 <= section.bgm_volume <= 1.0):
                    track = get_bgm_track(validated_bgm_id)
                    if track:
                        section.bgm_volume = track.default_volume
                        logger.warning(
                            f"無効なBGM音量が指定されました: {section.bgm_volume} -> "
                            f"デフォルト音量({track.default_volume})に設定"
                        )
                    else:
                        section.bgm_volume = 0.0

                logger.info(
                    f"BGM設定（LLM選択）: {section.bgm_id} (volume: {section.bgm_volume})"
                )
            else:
                # その他のモード: 従来通り固定BGMを使用
                bgm_config = get_section_bgm(context.section_definition.section_key)
                section.bgm_id = bgm_config["bgm_id"]
                section.bgm_volume = bgm_config["volume"]
                logger.info(
                    f"BGM設定（固定）: {bgm_config['bgm_id']} (volume: {bgm_config['volume']})"
                )

            # 背景が指定されている場合は上書き
            if context.section_definition.background:
                section.scene_background = context.section_definition.background
                logger.info(
                    f"背景を設定で上書き: {context.section_definition.background}"
                )

            segment_count = len(section.segments)
            logger.info(
                f"セクション生成成功: {context.section_definition.section_name} - {segment_count}セリフ"
            )

            # セリフ数チェック
            if segment_count < context.section_definition.min_lines:
                logger.warning(
                    f"セリフ数が少なめ: {segment_count}/{context.section_definition.min_lines}"
                )
            elif segment_count > context.section_definition.max_lines:
                logger.warning(
                    f"セリフ数が多め: {segment_count}/{context.section_definition.max_lines}"
                )

            return section

        except Exception as e:
            error_msg = f"セクション生成エラー ({context.section_definition.section_name}): {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise

    @staticmethod
    def summarize_section(section: VideoSection) -> str:
        """セクションを要約（次のセクションへの引き継ぎ用）"""
        summary_parts = []

        summary_parts.append(f"主な内容: {section.section_name}")

        # ずんだもんの最後のセリフ
        zundamon_segments = [s for s in section.segments if s.speaker == "zundamon"]
        if zundamon_segments:
            last_zundamon = zundamon_segments[-1]
            summary_parts.append(f"ずんだもんの状態: {last_zundamon.text[:30]}...")

        # 重要なキーワード抽出
        if (
            "異変" in section.section_name
            or "危機" in section.section_name
            or "カオス" in section.section_name
        ):
            keywords = GenericSectionGenerator._extract_keywords(section.segments)
            if keywords:
                summary_parts.append(f"キーワード: {', '.join(keywords[:3])}")

        return " / ".join(summary_parts)

    @staticmethod
    def _extract_keywords(segments: List) -> List[str]:
        """セグメントからキーワードを抽出"""
        keywords = []
        keyword_patterns = [
            "痛",
            "だるい",
            "眠れない",
            "集中できない",
            "肌荒れ",
            "頭痛",
            "吐き気",
            "疲労",
            "動悸",
            "めまい",
            "不眠",
            "イライラ",
            "怒",
            "喧嘩",
            "爆発",
            "崩壊",
            "終わ",
            "やばい",
            "最悪",
        ]

        for seg in segments:
            for keyword in keyword_patterns:
                if keyword in seg.text and keyword not in keywords:
                    keywords.append(keyword)

        return keywords
