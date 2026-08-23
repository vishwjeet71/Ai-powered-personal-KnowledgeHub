from langchain_openai import OpenAIEmbeddings, ChatOpenAI


def openaiChatModel(api_key: str, model_name: str):
    return ChatOpenAI(api_key=api_key, model=model_name)


def openaiEmbeddingModel(api_key: str, model_name: str):
    return OpenAIEmbeddings(api_key=api_key, model=model_name)


# NOTE logic was under testing.
