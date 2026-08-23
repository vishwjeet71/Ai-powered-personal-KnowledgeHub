from langchain_openai import ChatOpenAI, OpenAIEmbeddings


def openaiCompatibleEmbeddingModel(api_key: str, base_url: str, model_name: str):
    return OpenAIEmbeddings(
        api_key=api_key,
        base_url=base_url,
        model=model_name,
        check_embedding_ctx_length=False,
        max_retries=2,
        timeout=30,
    )


def openaiCompatibleChatModel(api_key: str, base_url: str, model_name: str):
    return ChatOpenAI(
        api_key=api_key, base_url=base_url, model=model_name, max_retries=2, timeout=30
    )
