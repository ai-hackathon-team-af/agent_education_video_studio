"""背景設定 - 台本ベースの背景生成"""

import re
import hashlib
from typing import Optional, List


def script_to_background_name(script_data: dict) -> str:
    """台本データから一意の背景名を生成する

    タイトルのみを使用してファイル名を生成する。
    同じタイトルの台本では同じ背景名になる（再生成時は上書き）。

    Args:
        script_data: 台本データ

    Returns:
        背景ファイル名（拡張子なし）
    """
    # タイトルのみを使用
    title = script_data.get("title", "")

    # タイトルからハッシュを生成（安定したハッシュ）
    title_hash = hashlib.md5(title.encode()).hexdigest()[:8]

    # スペースや特殊文字をアンダースコアに置換
    name = re.sub(r'[^\w\s]', '', title)
    name = re.sub(r'\s+', '_', name.strip())

    # 長すぎる場合は切り詰め
    if len(name) > 40:
        name = name[:40]

    # 空の場合はデフォルト
    if not name:
        name = "background"

    return f"{name.lower()}_{title_hash}"


def theme_to_background_name(theme: str) -> str:
    """テーマ文字列から背景名を生成する（後方互換性用）"""
    name = re.sub(r'[^\w\s]', '', theme)
    name = re.sub(r'\s+', '_', name.strip())
    if len(name) > 50:
        name = name[:50]
    if not name:
        name = "default_background"
    return name.lower()


def clean_title_for_prompt(title: str) -> str:
    """タイトルからプロンプト用に特殊文字を除去する

    Args:
        title: 元のタイトル

    Returns:
        クリーンなタイトル文字列
    """
    # 【】などの特殊文字を除去
    cleaned = re.sub(r'[【】「」『』（）\(\)\[\]]', ' ', title)
    # 連続するスペースを1つに
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def extract_script_content(script_data: dict) -> str:
    """台本データから背景生成用のテキストを抽出する

    タイトルのみを使用してシンプルなプロンプトを生成する。
    特殊文字は除去してクリーンなテキストにする。

    Args:
        script_data: 台本データ

    Returns:
        背景生成用のプロンプトテキスト（タイトルのみ）
    """
    # タイトルのみを使用
    title = script_data.get("title", "")

    if title:
        # 特殊文字を除去
        return clean_title_for_prompt(title)

    # タイトルがない場合はデフォルト
    return "educational video background"


def get_background_prompt_from_script(script_data: dict) -> str:
    """台本データから背景生成用のプロンプトを生成する

    プロンプトは台本の言葉のみを使用する。

    Args:
        script_data: 台本データ

    Returns:
        Imagen 4用の画像生成プロンプト
    """
    content = extract_script_content(script_data)

    # 台本の内容のみでプロンプトを構築（イラスト調・文字なしを強調）
    prompt = f"anime style background illustration inspired by {content}, colorful scenery, bright colors, hand-drawn look, 16:9 aspect ratio, no people, no characters, absolutely no text, no letters, no words, no writing, no signs, no labels, pure illustration only, clean background"

    return prompt


# 後方互換性のため残す
def get_background_prompt_for_theme(
    theme: str,
    script_keywords: Optional[List[str]] = None
) -> str:
    """テーマと台本のキーワードから背景生成用のプロンプトを生成する（後方互換性用）"""
    keywords_text = ""
    if script_keywords:
        unique_keywords = list(dict.fromkeys(script_keywords))[:10]
        keywords_text = ", ".join(unique_keywords)

    if keywords_text:
        prompt = f"{theme}, {keywords_text}, anime background, 16:9, no people, bright"
    else:
        prompt = f"{theme}, anime background, 16:9, no people, bright"

    return prompt


def extract_keywords_from_script(script_data: dict) -> List[str]:
    """台本データからキーワードを抽出する（後方互換性用）"""
    keywords = []

    if "title" in script_data:
        keywords.append(script_data["title"])

    if "theme" in script_data:
        keywords.append(script_data["theme"])

    if "sections" in script_data:
        for section in script_data["sections"]:
            if "section_name" in section:
                keywords.append(section["section_name"])

            if "segments" in section:
                for segment in section["segments"]:
                    text = segment.get("text", "")
                    quoted = re.findall(r'「([^」]+)」', text)
                    keywords.extend(quoted)

    unique_keywords = list(dict.fromkeys(keywords))
    return unique_keywords
