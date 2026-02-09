"""AI models configuration - Google Gemini API"""

from typing import List, Dict, Any

# 利用可能なAIモデルの設定
AVAILABLE_MODELS: List[Dict[str, Any]] = [
    {
        "id": "gemini-3-flash-preview",
        "name": "Gemini 3 Flash",
        "provider": "google",
        "temperature_range": (0.0, 2.0),
        "default_temperature": 1.0,
        "max_tokens": 8192,
        "recommended": True,
    },
    {
        "id": "gemini-1.5-pro",
        "name": "Gemini 1.5 Pro",
        "provider": "google",
        "temperature_range": (0.0, 2.0),
        "default_temperature": 1.0,
        "max_tokens": 8192,
        "recommended": False,
    },
    {
        "id": "gemini-1.5-flash",
        "name": "Gemini 1.5 Flash",
        "provider": "google",
        "temperature_range": (0.0, 2.0),
        "default_temperature": 1.0,
        "max_tokens": 8192,
        "recommended": False,
    },
]

# デフォルトモデル設定
DEFAULT_MODEL_ID = "gemini-3-flash-preview"


# モデル設定を取得する関数
def get_model_config(model_id: str) -> Dict[str, Any]:
    """指定されたモデルIDの設定を取得する"""
    for model in AVAILABLE_MODELS:
        if model["id"] == model_id:
            return model
    return get_default_model_config()


def get_default_model_config() -> Dict[str, Any]:
    """デフォルトモデルの設定を取得する"""
    return get_model_config(DEFAULT_MODEL_ID)


def get_recommended_model_id() -> str:
    """推奨モデルのIDを取得する"""
    for model in AVAILABLE_MODELS:
        if model.get("recommended", False):
            return model["id"]
    return DEFAULT_MODEL_ID


def get_all_models() -> List[Dict[str, Any]]:
    """利用可能なすべてのモデル設定を取得する"""
    return AVAILABLE_MODELS
