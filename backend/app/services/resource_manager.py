import logging
import os
import cv2
from typing import Dict, List, Optional

from app.config.resource_config.backgrounds import (
    theme_to_background_name,
    script_to_background_name,
)

logger = logging.getLogger(__name__)


class ResourceManager:
    """リソース管理クラス"""

    def __init__(self, video_processor):
        self.video_processor = video_processor

    def load_character_images(self) -> Dict:
        """キャラクター画像の読み込み"""
        character_images = self.video_processor.load_all_character_images()
        if not character_images:
            logger.error("No character images loaded")
            return None
        return character_images

    def load_backgrounds(
        self, theme: Optional[str] = None, script_data: Optional[Dict] = None
    ) -> Dict:
        """背景画像の読み込み（台本データまたはテーマに基づいてデフォルト背景を設定）

        Args:
            theme: スクリプトのテーマ（背景選択に使用、後方互換性）
            script_data: 台本データ（背景選択に使用、優先）

        Returns:
            背景画像の辞書。script_dataまたはthemeが指定された場合、
            適切な背景が"default"にマップされる
        """
        backgrounds = self.video_processor.load_backgrounds()
        if not backgrounds:
            logger.error("No background images loaded")
            return None

        # script_dataが指定されている場合、台本から背景名を取得（優先）
        if script_data:
            selected_bg_name = script_to_background_name(script_data)
            logger.info(f"Looking for background: '{selected_bg_name}'")
            if selected_bg_name in backgrounds:
                backgrounds["default"] = backgrounds[selected_bg_name]
                logger.info(
                    f"Script-based background selected: '{selected_bg_name}'"
                )
            else:
                logger.warning(
                    f"Background '{selected_bg_name}' not found, using existing default"
                )
        # テーマのみが指定されている場合（後方互換性）
        elif theme:
            selected_bg_name = theme_to_background_name(theme)
            if selected_bg_name in backgrounds:
                backgrounds["default"] = backgrounds[selected_bg_name]
                logger.info(
                    f"Theme-based background selected: '{selected_bg_name}' for theme '{theme}'"
                )
            else:
                logger.warning(
                    f"Background '{selected_bg_name}' not found for theme '{theme}', using existing default"
                )

        return backgrounds

    def generate_blink_timings(self, total_duration: float) -> List:
        """瞬きタイミングの生成"""
        blink_timings = []
        for char_name in self.video_processor.characters.keys():
            char_blink_timings = self.video_processor.generate_blink_timings(
                total_duration, char_name
            )
            blink_timings.extend(char_blink_timings)
        return blink_timings

    def validate_resources(self, character_images: Dict, backgrounds: Dict) -> bool:
        """リソースの検証"""
        return character_images is not None and backgrounds is not None

    def load_item_images(self) -> Dict:
        """教育アイテム画像を動的に読み込む

        assets/items/ 配下の全てのPNG画像を再帰的に読み込みます。
        画像ファイル名（拡張子なし）がアイテムIDとして使用されます。

        Returns:
            Dict[str, np.ndarray]: アイテムID -> 画像データの辞書
        """
        items = {}
        item_base_dir = "assets/items"

        if not os.path.exists(item_base_dir):
            logger.warning(f"Item directory not found: {item_base_dir}")
            return items

        # assets/items/ 配下の全てのPNGファイルを再帰的に検索
        for root, dirs, files in os.walk(item_base_dir):
            for file in files:
                if file.lower().endswith('.png'):
                    # ファイル名（拡張子なし）をアイテムIDとして使用
                    item_id = os.path.splitext(file)[0]
                    file_path = os.path.join(root, file)

                    # 画像を読み込み
                    img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
                    if img is not None:
                        items[item_id] = img
                        # 相対パスを表示
                        rel_path = os.path.relpath(file_path, item_base_dir)
                        logger.info(f"Loaded item image: '{item_id}' from items/{rel_path}")
                    else:
                        logger.warning(f"Failed to load item image: {file_path}")

        logger.info(f"Total item images loaded: {len(items)} from {item_base_dir}")
        if len(items) == 0:
            logger.info(f"No item images found. Place PNG files in {item_base_dir}/ to use them.")

        return items
