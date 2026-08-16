from openai import OpenAI
from langchain_core.messages.ai import AIMessage
from langchain_core.embeddings import Embeddings

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

class _OpenAICompatibleEmbeddings(Embeddings):
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
    ):
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url.rstrip("/"),
        )
        self.model = model

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        response = self.client.embeddings.create(
            model=self.model,
            input=texts,
        )

        return [item.embedding for item in response.data]

    def embed_query(self, text: str) -> list[float]:
        response = self.client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding


class _OpenAICompatibleChat:
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
    ):
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url.rstrip("/"),
        )
        self.model = model

    def invoke(
        self,
        message: str,
        system: str = "You are a helpful assistant.",
    ) -> str:

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system,
                },
                {
                    "role": "user",
                    "content": message,
                },
            ],
        )

        return AIMessage(
            content=response.choices[0].message.content,
            response_metadata={
                "model": response.model,
                "usage": response.usage.model_dump() if response.usage else {},
                "finish_reason": response.choices[0].finish_reason,
            }
        )


def openaiCompatibleEmbeddingModel(
        api_key: str,
        base_url: str,
        model_name: str
):
    return OpenAIEmbeddings(
        api_key= api_key,
        base_url= base_url,
        model= model_name,
        check_embedding_ctx_length=False,
        max_retries=2,
        timeout= 30  
    )

def openaiCompatibleChatModel(
        api_key: str,
        base_url:str,
        model_name: str
):
    return ChatOpenAI(
        api_key=api_key,
        base_url= base_url,
        model= model_name,
        max_retries=2,
        timeout= 30
    )