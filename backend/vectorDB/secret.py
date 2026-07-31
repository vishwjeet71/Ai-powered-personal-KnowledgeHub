import os, json
from backend.llms.llm import call_llm
from typing import Optional


def load_secrets():
    
    if not os.path.exists("secret.json"):
        return (None, None)

    try:
        with open("secret.json", "r") as f:
            data = json.load(f)
    except json.JSONDecodeError as E:
        print("Error: Error occurred while reading the secret file.", end="\n")
        return (None, None)
    except Exception as E:
        print("Error: unexpected error while reading secret", end="\n")
        return (None, None)

    api_key = data.get("api_key", None)
    api_provider = data.get("api_provider", None)
    base_url = data.get("base_url", None)
    chat_model_name = data.get("chat_model_name", None)
    embd_model_name = data.get("embd_model_name", None)

    try:
        return call_llm(
            api_key= api_key,
            api_providers= api_provider,
            base_url= base_url,
            chat_model_name= chat_model_name,
            embed_model_name= embd_model_name
        )

    except Exception as e:
        print("Error: Error occurred while loading LLM objects.", e, end="\n")
        return (None, None)


def create_secret(
        user_api_key: str,
        user_api_provider: str,
        user_base_url: Optional[str] = None,
        user_chat_model_name: Optional[str] = None,
        user_embd_model_name: Optional[str] = None
):

    if not os.path.exists("secret.json"):
        with open("secret.json", "w") as f:
            pass

    with open("secret.json", "w") as file:        
        secret = {
            "api_key": user_api_key,
            "api_provider": user_api_provider,
            "base_url": user_base_url,
            "chat_model_name": user_chat_model_name,
            "embd_model_name": user_embd_model_name
        }
        json.dump(secret, file, indent=4)


def remove_secret():

    if os.path.exists("secret.json"):
        os.remove("secret.json")
        return True
    else:
        return False