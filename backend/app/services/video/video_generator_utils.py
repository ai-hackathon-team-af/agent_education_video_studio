"""動画生成ユーティリティ関数"""

import os
import subprocess
import logging
from typing import List, Dict
from app.models.scripts.common import VideoSection

logger = logging.getLogger(__name__)


def combine_video_with_audio(
    temp_video_path: str, combined_audio, output_path: str
) -> str:
    """動画と音声を結合する（ffmpegで映像ストリームコピー）"""
    temp_audio_path = temp_video_path.replace("_temp.mp4", "_temp_audio.wav")
    combined_audio.write_audiofile(temp_audio_path, fps=44100, logger=None)

    try:
        cmd = [
            "ffmpeg", "-y",
            "-i", temp_video_path,
            "-i", temp_audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-movflags", "+faststart",
            "-shortest",
            output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            logger.error(f"ffmpeg failed: {result.stderr}")
            raise RuntimeError(f"ffmpeg failed with return code {result.returncode}")
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

    return output_path


def calculate_section_durations(
    sections: List[VideoSection],
    audio_durations: Dict[str, float],
    audio_file_list: List[str],
) -> List[float]:
    """各セクションの長さを計算する"""
    import logging
    logger = logging.getLogger(__name__)
    
    section_durations = []
    current_segment_index = 0
    
    total_segments = sum(len(section.segments) for section in sections)
    logger.info(
        f"calculate_section_durations: "
        f"セクション数={len(sections)}, "
        f"総セグメント数={total_segments}, "
        f"音声ファイル数={len(audio_file_list)}"
    )

    for i, section in enumerate(sections):
        segment_count = len(section.segments)
        if current_segment_index + segment_count > len(audio_file_list):
            logger.error(
                f"セクション{i} ({section.section_name}): "
                f"インデックス範囲外エラー "
                f"(current_segment_index={current_segment_index}, "
                f"segment_count={segment_count}, "
                f"audio_file_list長さ={len(audio_file_list)})"
            )
            # 残りの音声ファイルをすべて使用
            section_audio_files = audio_file_list[current_segment_index:]
        else:
            section_audio_files = audio_file_list[
                current_segment_index : current_segment_index + segment_count
            ]
        
        # 各音声ファイルの長さを詳細に記録
        file_durations = []
        for audio_path in section_audio_files:
            duration = audio_durations.get(audio_path, 0.0)
            file_durations.append(duration)
        
        section_duration = sum(file_durations)
        section_durations.append(section_duration)
        logger.info(
            f"セクション{i} ({section.section_name}): "
            f"セグメント数={segment_count}, "
            f"音声ファイル数={len(section_audio_files)}, "
            f"長さ={section_duration:.3f}秒 "
            f"(開始インデックス={current_segment_index}, "
            f"終了インデックス={current_segment_index + segment_count - 1})"
        )
        current_segment_index += segment_count

    total_calculated_duration = sum(section_durations)
    logger.info(
        f"セクションduration計算完了: "
        f"合計={total_calculated_duration:.3f}秒, "
        f"セクション数={len(section_durations)}"
    )

    return section_durations

