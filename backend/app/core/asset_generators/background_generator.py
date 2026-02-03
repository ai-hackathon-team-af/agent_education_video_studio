"""Imagen 4を使用した背景画像自動生成"""

import os
from typing import Optional, Tuple

from app.config import Paths
from app.utils.logger import get_logger
from app.config.resource_config.backgrounds import (
    script_to_background_name,
    get_background_prompt_from_script,
)

logger = get_logger(__name__)


class BackgroundImageGenerator:
    """Imagen 4を使用した背景画像自動生成クラス"""

    def __init__(self):
        """初期化"""
        self.client = None
        self.model = "imagen-4.0-generate-001"
        self.backgrounds_dir = Paths.get_backgrounds_dir()
        self._ensure_backgrounds_dir()

    def _ensure_backgrounds_dir(self):
        """背景ディレクトリが存在することを確認"""
        os.makedirs(self.backgrounds_dir, exist_ok=True)

    def _initialize_client(self):
        """Google Gen AIクライアントを初期化"""
        if self.client is not None:
            return

        try:
            from google import genai

            self.client = genai.Client()
        except ImportError as e:
            logger.error(f"Failed to import google-genai: {e}")
            raise ImportError(
                "google-genai package is not installed. "
                "Please install it with: pip install google-genai"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Google Gen AI client: {e}")
            raise

    def check_background_exists(self, bg_name: str) -> bool:
        """背景画像が存在するかチェック"""
        extensions = [".png", ".jpg", ".jpeg", ".webp"]
        for ext in extensions:
            path = os.path.join(self.backgrounds_dir, f"{bg_name}{ext}")
            if os.path.exists(path):
                return True
        return False

    def get_background_path(self, bg_name: str) -> Optional[str]:
        """背景画像のパスを取得"""
        extensions = [".png", ".jpg", ".jpeg", ".webp"]
        for ext in extensions:
            path = os.path.join(self.backgrounds_dir, f"{bg_name}{ext}")
            if os.path.exists(path):
                return path
        return None

    def generate_background_from_script(
        self, script_data: dict, custom_prompt: Optional[str] = None
    ) -> Tuple[str, str]:
        """台本データから背景画像を生成する

        常に新規生成する（キャッシュは使わない）

        Args:
            script_data: 台本データ（title, theme, sections等を含む辞書）
            custom_prompt: カスタムプロンプト（指定時は自動生成をスキップ）

        Returns:
            Tuple[str, str]: (生成された背景画像のパス, 使用されたプロンプト)
        """
        if not script_data:
            raise ValueError("script_data is required")

        # 台本から背景名を生成
        bg_name = script_to_background_name(script_data)

        # カスタムプロンプトが指定されている場合はそれを使用、なければ台本から生成
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = get_background_prompt_from_script(script_data)

        return self._generate_background_image(bg_name, prompt)

    def _generate_background_image(self, bg_name: str, prompt: str) -> Tuple[str, str]:
        """背景画像を生成して保存

        Args:
            bg_name: 背景名（ファイル名用）
            prompt: 画像生成プロンプト

        Returns:
            Tuple[str, str]: (保存された画像のパス, 使用されたプロンプト)
        """
        # クライアント初期化
        self._initialize_client()

        try:
            from google.genai.types import GenerateImagesConfig

            # 画像生成
            image_result = self.client.models.generate_images(
                model=self.model,
                prompt=prompt,
                config=GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="16:9",
                    person_generation="dont_allow",
                ),
            )

            # 画像が生成されなかった場合
            if not image_result.generated_images:
                error_msg = "画像が生成されませんでした。"
                logger.error(error_msg)
                raise ValueError(error_msg)

            output_path = os.path.join(self.backgrounds_dir, f"{bg_name}.png")

            # 画像を取得して保存
            generated_image = image_result.generated_images[0]

            # PIL Imageとして取得
            if hasattr(generated_image, "image"):
                img = generated_image.image
            else:
                raise ValueError(
                    f"Cannot extract image from result: {type(generated_image)}"
                )

            # 画像を保存
            img.save(output_path)

            # 保存確認
            if not os.path.exists(output_path):
                raise IOError(f"Image file was not saved: {output_path}")

            return output_path, prompt

        except Exception as e:
            logger.error(f"Failed to generate background: {e}", exc_info=True)
            raise

    def get_background_name_from_script(self, script_data: dict) -> str:
        """台本から背景名を取得（生成はしない）"""
        return script_to_background_name(script_data)
