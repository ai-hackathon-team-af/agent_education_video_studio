"""LLMファクトリーモジュール - Google Vertex AI / Gemini API対応"""

import os
from typing import Dict, Any, Optional
from langchain_core.language_models.chat_models import BaseChatModel
from app.utils.logger import get_logger

logger = get_logger(__name__)


def create_gemini_llm(
    model_id: str,
    temperature: float = 0.7,
    max_tokens: int = 8192,
    request_timeout: int = 600,
) -> BaseChatModel:
    """Google Gemini LLMインスタンスを生成する

    Vertex AI または直接 Gemini API を使用します。
    - GOOGLE_CLOUD_PROJECT が設定されている場合: Vertex AI を使用
    - GOOGLE_API_KEY が設定されている場合: Gemini API を直接使用

    Args:
        model_id: GeminiモデルID (例: gemini-2.0-flash)
        temperature: 温度パラメータ (0.0 ~ 1.0)
        max_tokens: 最大トークン数
        request_timeout: リクエストタイムアウト（秒）

    Returns:
        BaseChatModel: LLMインスタンス

    Raises:
        ValueError: 認証情報が設定されていない場合
    """
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("VERTEX_AI_LOCATION", "asia-northeast1")
    api_key = os.getenv("GOOGLE_API_KEY")

    # Vertex AI を優先使用
    if project_id:
        logger.info(f"Using Vertex AI with project: {project_id}, location: {location}")
        from langchain_google_vertexai import ChatVertexAI

        return ChatVertexAI(
            model=model_id,
            temperature=temperature,
            max_output_tokens=max_tokens,
            project=project_id,
            location=location,
        )

    # フォールバック: 直接 Gemini API を使用
    if api_key:
        logger.info("Using Gemini API directly (GOOGLE_API_KEY)")
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_id,
            temperature=temperature,
            max_output_tokens=max_tokens,
            timeout=request_timeout,
            google_api_key=api_key,
        )

    raise ValueError(
        "Google Cloud の認証情報が設定されていません。\n"
        "以下のいずれかを設定してください:\n"
        "- GOOGLE_CLOUD_PROJECT (Vertex AI 使用時)\n"
        "- GOOGLE_API_KEY (Gemini API 直接使用時)"
    )


def create_llm_from_model_config(
    model_config: Dict[str, Any], temperature: Optional[float] = None
) -> BaseChatModel:
    """モデル設定からLLMインスタンスを生成する

    Args:
        model_config: モデル設定辞書（id, provider, max_tokens, default_temperatureを含む）
        temperature: 温度パラメータ（Noneの場合はmodel_configのdefault_temperatureを使用）

    Returns:
        BaseChatModel: LLMインスタンス

    Raises:
        ValueError: サポートされていないプロバイダーの場合
    """
    provider = model_config.get("provider", "google")

    if provider not in ["google", "gemini", "vertexai"]:
        raise ValueError(
            f"サポートされていないプロバイダー: {provider}. Google Gemini/Vertex AIのみサポートしています。"
        )

    model_id = model_config["id"]
    max_tokens = model_config.get("max_tokens", 8192)

    if temperature is None:
        temperature = model_config.get("default_temperature", 0.7)

    return create_gemini_llm(
        model_id=model_id, temperature=temperature, max_tokens=max_tokens
    )
