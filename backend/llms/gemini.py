from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

google_default_chat_model = "gemini-3-flash-preview"
google_default_embed_model = "gemini-embedding-001"

def googleEmbeddingModel(
        api_key: str, model_name: str = google_default_embed_model
):
    return GoogleGenerativeAIEmbeddings(
        model= model_name,
        api_key = api_key,
        timeout=30,
        max_retries=2
    )

def googleChatModel(
        api_key: str, model_name: str = google_default_chat_model
):
    return ChatGoogleGenerativeAI(
        model= model_name,
        api_key = api_key,
        timeout= 30,
        max_retries=2
    )