"""LLMファクトリーモジュール - Google Gemini API対応"""

import os
from typing import Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from app.utils.logger import get_logger

logger = get_logger(__name__)


def create_gemini_llm(
    model_id: str,
    temperature: float = 0.7,
    max_tokens: int = 8192,
    request_timeout: int = 600,
) -> ChatGoogleGenerativeAI:
    """Google Gemini LLMインスタンスを生成する

    Args:
        model_id: GeminiモデルID (例: gemini-2.0-flash)
        temperature: 温度パラメータ (0.0 ~ 1.0)
        max_tokens: 最大トークン数
        request_timeout: リクエストタイムアウト（秒）

    Returns:
        ChatGoogleGenerativeAI: LLMインスタンス

    Raises:
        ValueError: Google API Keyが設定されていない場合
    """
    # Google API Keyの確認
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise ValueError(
            "Google API Keyが設定されていません。\n"
            "GOOGLE_API_KEY を .env ファイルに設定してください。"
        )

    return ChatGoogleGenerativeAI(
        model=model_id,
        temperature=temperature,
        max_output_tokens=max_tokens,
        timeout=request_timeout,
        google_api_key=api_key,
    )


def create_llm_from_model_config(
    model_config: Dict[str, Any], temperature: Optional[float] = None
) -> ChatGoogleGenerativeAI:
    """モデル設定からLLMインスタンスを生成する

    Args:
        model_config: モデル設定辞書（id, provider, max_tokens, default_temperatureを含む）
        temperature: 温度パラメータ（Noneの場合はmodel_configのdefault_temperatureを使用）

    Returns:
        ChatGoogleGenerativeAI: LLMインスタンス

    Raises:
        ValueError: サポートされていないプロバイダーの場合
    """
    provider = model_config.get("provider", "google")

    if provider not in ["google", "gemini"]:
        raise ValueError(
            f"サポートされていないプロバイダー: {provider}. Google Geminiのみサポートしています。"
        )

    model_id = model_config["id"]
    max_tokens = model_config.get("max_tokens", 8192)

    if temperature is None:
        temperature = model_config.get("default_temperature", 0.7)

    return create_gemini_llm(
        model_id=model_id, temperature=temperature, max_tokens=max_tokens
    )
