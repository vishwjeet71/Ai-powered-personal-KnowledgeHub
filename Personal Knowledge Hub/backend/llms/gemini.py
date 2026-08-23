from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings


def googleEmbeddingModel(api_key: str, model_name: str):
    return GoogleGenerativeAIEmbeddings(
        model=model_name, api_key=api_key, timeout=30, max_retries=2
    )


def googleChatModel(api_key: str, model_name: str):
    return ChatGoogleGenerativeAI(
        model=model_name, api_key=api_key, timeout=30, max_retries=2
    )
