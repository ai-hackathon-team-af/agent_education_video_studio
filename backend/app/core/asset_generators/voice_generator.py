import requests
import json
import os
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, Optional, List, Tuple
from app.config import Characters

logger = logging.getLogger(__name__)


class VoiceGenerator:
    def __init__(self, api_url: str = None):
        self.api_url = api_url or os.getenv(
            "VOICEVOX_API_URL", "http://localhost:50021"
        )
        self.zundamon_speaker_id = 3
        self.metan_speaker_id = 2  # 四国めたん

        # キャラクター設定をconfigから動的に取得
        characters = Characters.get_all()
        self.speakers = {
            char_name: char_config.speaker_id
            for char_name, char_config in characters.items()
        }

    def check_health(self) -> bool:
        """Check if VOICEVOX API is available"""
        try:
            response = requests.get(f"{self.api_url}/speakers", timeout=10)
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            logger.error(f"VOICEVOX API health check failed: {e}")
            return False

    def generate_audio_query(
        self, text: str, speaker_id: int = None
    ) -> Optional[Dict[str, Any]]:
        """Generate audio query from text"""
        speaker_id = speaker_id or self.zundamon_speaker_id

        try:
            params = {"text": text, "speaker": speaker_id}

            response = requests.post(
                f"{self.api_url}/audio_query", params=params, timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Audio query generation failed: {response.status_code}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Audio query request failed: {e}")
            return None

    def synthesize_audio(
        self, audio_query: Dict[str, Any], speaker_id: int = None
    ) -> Optional[bytes]:
        """Synthesize audio from audio query"""
        speaker_id = speaker_id or self.zundamon_speaker_id

        try:
            response = requests.post(
                f"{self.api_url}/synthesis",
                headers={"Content-Type": "application/json"},
                params={"speaker": speaker_id},
                data=json.dumps(audio_query),
                timeout=60,
            )

            if response.status_code == 200:
                return response.content
            else:
                logger.error(f"Audio synthesis failed: {response.status_code}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Audio synthesis request failed: {e}")
            return None

    def generate_voice(
        self,
        text: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        intonation: float = 1.0,
        output_path: str = None,
        speaker: str = "zundamon",
    ) -> Optional[str]:
        """Generate voice file from text with parameters"""

        # 話者IDを取得
        speaker_id = self.speakers.get(speaker, self.zundamon_speaker_id)

        # Generate audio query
        audio_query = self.generate_audio_query(text, speaker_id)
        if not audio_query:
            return None

        # Apply voice parameters
        audio_query["speedScale"] = speed
        audio_query["pitchScale"] = pitch
        audio_query["intonationScale"] = intonation

        # Synthesize audio
        audio_data = self.synthesize_audio(audio_query, speaker_id)
        if not audio_data:
            return None

        # Save to file
        if not output_path:
            output_path = "/app/temp/generated_voice.wav"

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        try:
            with open(output_path, "wb") as f:
                f.write(audio_data)
            logger.info(f"Voice generated successfully for {speaker}: {output_path}")
            return output_path
        except IOError as e:
            logger.error(f"Failed to save audio file: {e}")
            return None

    def _prepare_voice_task(
        self,
        i: int,
        conv: Dict,
        speed: float,
        pitch: float,
        intonation: float,
        output_dir: str,
    ) -> Optional[Tuple[int, str, float, float, float, str, str]]:
        """会話アイテムから音声生成タスクのパラメータを準備する"""
        speaker = conv.get("speaker", "zundamon")
        text = conv.get("text_for_voicevox", conv.get("text", "")).strip()

        if not text:
            return None

        characters = Characters.get_all()
        char_config = characters.get(speaker)
        expression = conv.get("expression", "normal")

        if char_config and expression in char_config.expression_voice_map:
            final_speed = char_config.expression_voice_map[expression].speed
        elif char_config:
            final_speed = char_config.default_speed
        else:
            final_speed = speed if speed is not None else 1.0

        if char_config and expression in char_config.expression_voice_map:
            final_pitch = char_config.expression_voice_map[expression].pitch
        elif char_config:
            final_pitch = char_config.default_pitch
        else:
            final_pitch = pitch if pitch is not None else 0.0

        if char_config and expression in char_config.expression_voice_map:
            final_intonation = char_config.expression_voice_map[expression].intonation
        elif char_config:
            final_intonation = char_config.default_intonation
        else:
            final_intonation = intonation if intonation is not None else 1.0

        audio_filename = f"conv_{i:03d}_{speaker}.wav"
        audio_path = os.path.join(output_dir, audio_filename)

        return (i, text, final_speed, final_pitch, final_intonation, audio_path, speaker)

    def _generate_voice_worker(
        self, task: Tuple[int, str, float, float, float, str, str]
    ) -> Tuple[int, Optional[str]]:
        """並列実行用の音声生成ワーカー"""
        i, text, speed, pitch, intonation, audio_path, speaker = task
        generated_path = self.generate_voice(
            text=text,
            speed=speed,
            pitch=pitch,
            intonation=intonation,
            output_path=audio_path,
            speaker=speaker,
        )
        return (i, generated_path)

    def generate_conversation_voices(
        self,
        conversations: List[Dict],
        speed: float = None,
        pitch: float = None,
        intonation: float = None,
        output_dir: str = None,
    ) -> List[str]:
        """Generate voice files for conversation in parallel

        Args:
            conversations: List of conversation items with keys: 'speaker', 'text'
            speed, pitch, intonation: Global voice parameters (None = use character defaults)
            output_dir: Output directory for audio files

        Returns:
            List of audio file paths in conversation order
        """
        if not output_dir:
            output_dir = "/app/temp"

        os.makedirs(output_dir, exist_ok=True)

        # タスクを準備
        tasks = []
        for i, conv in enumerate(conversations):
            task = self._prepare_voice_task(i, conv, speed, pitch, intonation, output_dir)
            if task is not None:
                tasks.append(task)

        if not tasks:
            return []

        # 並列で音声生成
        results: Dict[int, Optional[str]] = {}
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(self._generate_voice_worker, task): task[0]
                for task in tasks
            }
            for future in as_completed(futures):
                idx = futures[future]
                try:
                    i, generated_path = future.result()
                    results[i] = generated_path
                    if generated_path:
                        logger.info(f"Generated conversation voice {i}: {generated_path}")
                    else:
                        logger.warning(f"Failed to generate voice for conversation {i}")
                except Exception as e:
                    logger.error(f"Voice generation task {idx} raised exception: {e}")
                    results[idx] = None

        # 元の順序で結果を組み立て
        audio_paths = []
        for task in tasks:
            i = task[0]
            path = results.get(i)
            if path:
                audio_paths.append(path)

        return audio_paths

