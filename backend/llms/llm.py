from backend.llms.gemini import googleChatModel, googleEmbeddingModel, google_default_chat_model, google_default_embed_model
from backend.llms.openai_compatible_api import openaiCompatibleChatModel, openaiCompatibleEmbeddingModel
from backend.llms.openAi import openaiChatModel, openaiEmbeddingModel, default_chat_model, default_embedding_model
from typing import Optional

integrated_providers = set()

def call_llm(
        api_key: str,
        api_providers: str,
        base_url: Optional[str] = None,
        chat_model_name: Optional[str] = None,
        embed_model_name: Optional[str] = None
):
    if api_providers == "google":
        return (
            googleChatModel(
                api_key= api_key,
                model_name= chat_model_name if chat_model_name else google_default_chat_model    
            ),
            googleEmbeddingModel(
                api_key= api_key,
                model_name= embed_model_name if embed_model_name else google_default_embed_model
            )
        )
    
    elif api_providers == "openai": # NOTE OpenAI integration has not been tested yet.
        return (
            openaiChatModel(
                api_key= api_key,
                model_name= chat_model_name if chat_model_name else default_chat_model
            ),
            openaiEmbeddingModel(
                api_key= api_key,
                model_name= embed_model_name if embed_model_name else default_embedding_model
            )
        )
    
    elif (api_providers == "openCompatible") and (chat_model_name) and (base_url) and (embed_model_name):
        return (
            openaiCompatibleChatModel(
                api_key=api_key,
                base_url=base_url,
                model_name= chat_model_name
            ),
            openaiCompatibleEmbeddingModel(
                api_key=api_key,
                base_url=base_url,
                model_name= embed_model_name
            )
        )

    else:
        print("[ERROR]   Invide Model details", end="\n")
        return (
            None,
            None
        )