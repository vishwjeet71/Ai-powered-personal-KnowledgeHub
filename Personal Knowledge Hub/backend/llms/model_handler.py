from platformdirs import user_config_dir
import os, json

# moduls
from llms.gemini import googleChatModel, googleEmbeddingModel
from llms.openAi import openaiChatModel, openaiEmbeddingModel
from llms.openai_compatible_api import (
    openaiCompatibleChatModel,
    openaiCompatibleEmbeddingModel,
)

# default models
google_default_chat_model = "gemini-3-flash-preview"
google_default_embd_model = "gemini-embedding-001"

openai_default_chat_model = "gpt-5.6"  # temp name
openai_default_embd_model = "text-embedding-3-small"  # temp name


def load_models():
    config_loc = user_config_dir(appname="com.vishwjeet.personal-knowledge-hub")
    credentials_loc = os.path.join(config_loc, "secret.json")

    if not os.path.exists(credentials_loc):
        raise FileExistsError(f"File not exists on '{credentials_loc}'")

    with open(credentials_loc, "r", encoding="utf-8") as f:
        data = json.load(f)

    api_key = data.get("api_key", None)
    api_provider = data.get("api_provider", None)
    base_url = data.get("base_url", None)
    chat_model_name = data.get("chat_model_name", None)
    embd_model_name = data.get("embd_model_name", None)

    if api_provider == "google":
        return (
            googleChatModel(api_key=api_key, model_name=google_default_chat_model),
            googleEmbeddingModel(api_key=api_key, model_name=google_default_embd_model),
        )

    elif api_provider == "openai":  # NOTE OpenAI integration has not been tested yet.
        return (
            openaiChatModel(api_key=api_key, model_name=openai_default_chat_model),
            openaiEmbeddingModel(api_key=api_key, model_name=openai_default_embd_model),
        )

    elif (
        (api_provider == "openai-compatible")
        and (chat_model_name)
        and (base_url)
        and (embd_model_name)
    ):
        return (
            openaiCompatibleChatModel(
                api_key=api_key, base_url=base_url, model_name=chat_model_name
            ),
            openaiCompatibleEmbeddingModel(
                api_key=api_key, base_url=base_url, model_name=embd_model_name
            ),
        )

    else:
        raise ValueError("Invlid Api provider!")
