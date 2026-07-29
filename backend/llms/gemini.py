from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

def googleEmbeddingModel(
        api_key: str, model_name: str = "gemini-embedding-001"
):
    return GoogleGenerativeAIEmbeddings(
        model= model_name,
        api_key = api_key
    )

def googleChatModel(
        api_key: str, model_name: str = "gemini-3-flash-preview"
):
    return ChatGoogleGenerativeAI(
        model= model_name,
        api_key = api_key
    )