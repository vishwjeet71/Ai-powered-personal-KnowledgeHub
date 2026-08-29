from platformdirs import user_config_dir
import os, logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal

from langchain_community.vectorstores import LanceDB
from langchain_community.tools import tool

# moduls
from vectorDB.vectorDB import lancedb_object, get_page_data, delete_document
from llms.model_handler import load_models
from llms.agent import get_Agent, get_agent_output
from documentLoaders.file_loader import load_document_file

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_model, embedding_model, vectordb, ai_agent
    chat_model = embedding_model = vectordb = ai_agent = None

    logging.info("Loading model objects...")
    try:
        chat_model, embedding_model = load_models()
    except FileExistsError as fee:
        logging.error(f"File not FOUND! '{fee}'")

    except ValueError as ve:
        logging.error(f"Invlid credentials '{ve}'")

    except Exception as E:
        logging.error(f"unexpected error! '{E}'")

    if chat_model and embedding_model:
        logging.info("Model objects loaded successfully.")

        try:
            vectordb = LanceDB(
                connection=lancedb_object,
                embedding=embedding_model,
                table_name="knowledge_base",
                mode="append",
            )
            logging.info("Successfully connected to the vector database.")

        except Exception as dbError:
            logging.error(
                f"Failed to initialize the vector database connection: {dbError}"
            )
    else:
        logging.error("Failed to load model objects.")

    yield


app = FastAPI(
    title="Personal KnowledgeHub",
    description="Hands-on project implementing a LangChain-based RAG pipeline for intelligent document retrieval and grounded Q&A across multiple file formats.",
    version="1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# input schema
class VectorDb(BaseModel):
    path: str


class API(BaseModel):
    credentials_path: str
    api_key: str
    api_provider: Literal["openai", "google", "openai-compatible"] | None = None
    base_url: Optional[str] = None
    chat_model_name: Optional[str] = None
    embd_model_name: Optional[str] = None


class Chat(BaseModel):
    query: str


class DeleteRequest(BaseModel):
    ids: list[str]


@app.get("/load-models")
async def loadModels(response: Response):
    config_loc = user_config_dir(appname="com.vishwjeet.personal-knowledge-hub")
    credentials_loc = os.path.join(config_loc, "secret.json")

    global chat_model, embedding_model, vectordb, ai_agent
    chat_model = embedding_model = vectordb = ai_agent = None

    if not os.path.exists(credentials_loc):
        response.status_code = status.HTTP_404_NOT_FOUND
        return {
            "CM": f"Credentials file not found at: {credentials_loc}",
            "UM": "Configuration file not found. Please check your application configuration.",
        }

    try:
        chat_model, embedding_model = load_models()

        if chat_model and embedding_model:
            logging.info("Model objects loaded successfully.")

            try:
                vectordb = LanceDB(
                    connection=lancedb_object,
                    embedding=embedding_model,
                    table_name="knowledge_base",
                    mode="append",
                )
                logging.info("Successfully connected to the vector database.")

            except Exception as dbError:
                logging.error(
                    f"Failed to initialize the vector database connection: {dbError}"
                )

        return {
            "CM": "Chat, Embedding Vectordb load successfully!",
            "UM": "Backend Update successfully!",
        }

    except FileExistsError as fee:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {
            "CM": f"Failed to load models because a required file already exists or could not be accessed correctly: {fee}",
            "UM": "Unable to load the AI models. Please check your configuration and try again.",
        }
    except ValueError as ve:
        response.status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
        return {
            "CM": f"Invalid model configuration or credentials: {ve}",
            "UM": "The model configuration is invalid. Please check your settings and try again.",
        }
    except Exception as E:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "CM": f"Unexpected error while loading Chat and Embedding models: {E}",
            "UM": "Something went wrong while loading the AI models.",
        }


@app.post("/chat")
async def chat(body: Chat, response: Response):

    if not chat_model:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        logging.error("model not initialized!")
        return {
            "CM": "Model not initialized",
            "UM": "Check your credentials or update them!",
        }

    try:
        output = await chat_model.ainvoke(body.query)
        return output.content

    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        logging.error(f"unexpected error! '{e}'")
        return {
            "CM": f"error: {e}",
            "UM": "We couldn’t generate the output. Please verify your credentials and try again.",
        }


@app.get("/share-resources")
async def share_resources(path: str, response: Response):
    try:
        if path.split(".")[-1] == "pdf":
            docs = load_document_file(path_of_file=path, source="local")

        elif path.split(".")[-1] in ("doc", "docx"):
            docs = load_document_file(path_of_file=path, source="local")

        elif path.split(".")[-1] == "txt":
            docs = load_document_file(path_of_file=path, source="local")

        # NOTE We will build a function that downloads the file and then provides the file path. Once the work is done, we will remove that file.
        elif path.split(".")[-1] == "html":
            docs = load_document_file(path_of_file=path, source="web")

        else:
            response.status_code = status.HTTP_501_NOT_IMPLEMENTED
            return {
                "CM": f"get {path.split('.')[-1]} instead of [pdf, doc, docx]",
                "UM": "Get Invlid Document Formate!",
            }

        if isinstance(docs, list) and embedding_model is not None:
            await vectordb.aadd_documents(docs)

            return {
                "CM": "save documents into the vectore db.",
                "UM": "Documents Saved!",
            }

        if docs == 503:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {
                "CM": "Feature currently unavailable",
                "UM": "This functionality is not currently available. Please try again later.",
            }

        if docs == 501:
            response.status_code = status.HTTP_501_NOT_IMPLEMENTED
            return {
                "CM": "Feature not implemented",
                "UM": "This functionality has not been implemented yet. We'll add support for it in a future update.",
            }

        else:
            response.status_code = status.HTTP_501_NOT_IMPLEMENTED
            return {
                "CM": "Invalid input",
                "UM": "The request is invalid and cannot be processed. Please verify your input and try again.",
            }

    except Exception as E:

        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"CM": f"{E}", "UM": "Unable to save Documents."}


@app.get("/health")
async def get_health():

    # Send main backend component statuses to the frontend
    return {
        "agent": ai_agent is not None,
        "vectorDB": vectordb is not None,
        "models": chat_model is not None and embedding_model is not None,
        "backend": all(
            x is not None for x in [ai_agent, chat_model, embedding_model, vectordb]
        ),
    }


@app.post("/get_documents")
async def list_documents(pageNo: int):
    return get_page_data(pageNo)


@app.delete("/documents")
async def operation_delete(body: DeleteRequest, response: Response):
    return delete_document(body.ids, response)