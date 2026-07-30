from langchain_openai import OpenAIEmbeddings, ChatOpenAI

default_chat_model = "gpt-5.6"
default_embedding_model = "text-embedding-3-small"

def openaiChatModel(
        api_key: str, model_name: str = default_chat_model # temp name
):
    return ChatOpenAI(
        api_key= api_key,
        model= model_name
    )


def openaiEmbeddingModel(
        api_key: str, model_name: str = default_embedding_model # temp name
):
    return OpenAIEmbeddings(
        api_key= api_key,
        model= model_name
    )

# NOTE logic was under testing.