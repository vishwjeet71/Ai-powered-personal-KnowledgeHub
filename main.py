from fastapi import FastAPI, Response, status
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_community.tools import tool

from typing import Optional, Literal
import logging, os

from backend.vectorDB.secret import load_secrets, create_secret, remove_secret
from backend.llms.agent import get_Agent, get_agent_output
from backend.vectorDB.vectorDB import lancedb_object, build_query
from langchain_community.vectorstores import LanceDB
from backend.documentLoaders.file_loader import load_document_file
from backend.vectorDB.vectorDB import list_documents, delete_document, search_document_through_metadata, update_document

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_model, embedding_model, vectordb, ai_agent
    chat_model = embedding_model = vectordb = ai_agent = None

    logging.info("   Loading model objects...")
    chat_model, embedding_model = load_secrets()
    
    if chat_model and embedding_model:
        logging.info("   Model objects loaded successfully.")

        try:
            vectordb = LanceDB(
                connection= lancedb_object,
                embedding= embedding_model,
                table_name= "knowledge_base",
                mode="append"
            )
            logging.info("   Successfully connected to the vector database.")

        except Exception as dbError:
            logging.error(f"    Failed to initialize the vector database connection: {dbError}")

        try:
            ai_agent = get_Agent(
                chat_model= chat_model,
                tools= [retriever_for_agent]
            )

        except Exception as AgentError:
            logging.error(f"    We couldn't create the agent because of an unexpected error. Please try again. Details: {AgentError}")

    else:
        logging.error("  Failed to load model objects.")


    yield


@tool
def retriever_for_agent(
    user_query: str,
    metadata_file_name: Optional[str] = None,
    metadata_file_type: Optional[str] = None,
    metadata_source: Literal['local', 'pdf', 'doc', 'docx', 'web'] | None = None,
    metadata_update_by_user: Literal['Y', 'N'] | None = None
)-> list:
  """This function used for retrive users saved documents chunks from vector database. It mainly need user query, Optional your can filter data using given metadata pramaters."""

  # SQL Query Builder
  cmd = build_query(
      file_name= metadata_file_name,
      file_type= metadata_file_type,
      source= metadata_source,
      update_by_user= metadata_update_by_user
  )

  search_kwargs = {
      'k': 3,
      'fetch_k': 9,
      'lambda_mult': 0.6
  }

  if cmd:
    search_kwargs['filter'] = cmd

  if not vectordb:
      raise NotImplementedError('VectorDB is not configured correctly.')

  match_results = vectordb.as_retriever(
      search_type="mmr",
      search_kwargs=search_kwargs
  ).invoke(user_query)

  return match_results


app = FastAPI(
    title= "Personal KnowledgeHub",
    description= "Hands-on project implementing a LangChain-based RAG pipeline for intelligent document retrieval and grounded Q&A across multiple file formats.",
    version= "1.0",
    lifespan= lifespan
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

# input schema
class API(BaseModel):
    api_key: str
    api_provider: Literal['google', 'openai', 'openCompatible'] | None = None
    base_url : Optional[str] = None
    chat_model_name: Optional[str] = None
    embd_model_name: Optional[str] = None

class Chat(BaseModel):
    query: str

class DeleteRequest(BaseModel):
    ids: list[str]

class MeatadataFilter(BaseModel):
    file_type: Optional[str] = None 
    file_name: Optional[str] = None 
    source: Optional[str] = None
    update_by_user: Optional[str] = None    

class UpdateDocument(BaseModel):
    doc_id: str
    updated_pageContent: str


# loading web page
@app.get("/")
async def home(response: Response):
    return FileResponse("frontend/index.html")


# to save user's secret
@app.post("/create-secret")
async def load_API(body: API, response: Response):
    global chat_model, embedding_model, vectordb, ai_agent

    try:
        create_secret(
            user_api_key= body.api_key,
            user_api_provider= body.api_provider,
            user_base_url= body.base_url,
            user_chat_model_name= body.chat_model_name,
            user_embd_model_name= body.embd_model_name
        )

        logging.info("   Secret file created successfully!")

        chat_model, embedding_model = load_secrets()

        if chat_model and embedding_model:

            vectordb = LanceDB(
                connection= lancedb_object,
                embedding= embedding_model,
                table_name= "knowledge_base",
                mode="append"
            )

            ai_agent = get_Agent(
                chat_model= chat_model,
                tools= [retriever_for_agent]
            )

            return {
                'response': True,
                'result': "saved!"
            }
        
        else:
            response.status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
            if os.path.exists('secret.json'):
                os.remove("secret.json")

            return {
                "response": False, 
                'reason': "Invalid data model initialization failed!"
            }
    
    except Exception as E:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        print("log:", E, end="\n")

        if os.path.exists('secret.json'):
            os.remove('secret.json')

        return{
            'response': False,
            "reason": "failed to save secret"
        }


# delete user's secret file
@app.delete("/remove-secret")
async def delete_secret(response: Response):

    result = remove_secret()

    if result:

        global chat_model, embedding_model, ai_agent, vectordb
        chat_model = embedding_model = ai_agent = vectordb = None

        print("[Infor]: Initializing vector database in non-embedding mode.")

        logging.info("    Secret removed successfully.")

        return {
            'response': True,
            "result": "Done!"
        }
    else:
        logging.info("   Failed to remove secret.")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return{
            "response": False,
            "reason": "file not exist"
        }


@app.post("/chat")
async def chat(body: Chat, response: Response):
    try:
        if ai_agent is None:
            raise RuntimeError("Agent not initialized.")
        
        output = ai_agent.invoke({
            'messages': [
                {
                    'role': 'user',
                    'content': body.query
                }
            ]
        })

        result = get_agent_output(output)

        if isinstance(result, str):
            return {
                'response': True,
                'result': result
            }
        
        elif result == 501:
            response.status_code = status.HTTP_501_NOT_IMPLEMENTED
            return {
                'response': False,
                'reason': 'Your API appears to be incompatible with our implementation. Please use a different compatible API provider, such as Google.'
            }

        elif result == 500:
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return {
                'response': False,
                'reason': "Something went wrong while processing the output. Please try again."
            }
        else:
            response.status_code = status.HTTP_501_NOT_IMPLEMENTED
            return {
                'response': False,
                'result': 'Unrecognized input received.'
            }
                

    except ValueError:
        response.status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
        return {
            'response': False,
            'reason': 'Invalid response format. Try another API provider.'
        }
    
    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        logging.error(f"Error occurred while connecting to LLM server. Error:{e}")
        
        return {
            'response': False,
            "reason:": "Failed to connect to the AI model. Please try again or check your secrets"
        }


@app.post("/share-documents")
async def share_pdf(path: str, response: Response): # NOTE path = local path / url of online source
    try:

        if path.split(".")[-1] == "pdf":
            docs = load_document_file(path_of_file= path, source= "local")

        elif path.split(".")[-1] in ('doc', 'docx'):
            docs = load_document_file(path_of_file= path, source= "local")

        elif path.split(".")[-1] == "txt":
            docs = load_document_file(path_of_file= path, source= "local")

        elif path.split(".")[-1] == "html":
            docs = load_document_file(path_of_file= path, source= "web") # NOTE We will build a function that downloads the file and then provides the file path. Once the work is done, we will remove that file.

        else:
            response.status_code = status.HTTP_501_NOT_IMPLEMENTED
            return {
                'response': False,
                'reason': f"get {path.split('.')[-1]} instead of [pdf, doc, docx]"
            }
          
        if isinstance(docs, list):
            vectordb.add_documents(docs)
    
            return {'response': True, 'result': 'Documents saved successfully.'}

        if docs == 503:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {
                'response': False,
                'reason': "This functionality has not been implemented yet. We'll add support for it in a future update."
            }

        if docs == 501:
            response.status_code = status.HTTP_501_NOT_IMPLEMENTED
            return {
                'response': False,
                'reason': "Invalid document. Please verify the document and try again."
            }
        
        else:
            return {
                'response': False,
                'reason': 'The request is invalid and cannot be processed. Please verify your input and try again.'
            }
        
    except Exception as fileError:
        response.status_code = status.HTTP_422_UNPROCESSABLE_CONTENT

        print(f"[ERROR]: An error occurred while adding the PDF to the vector database: {fileError}")
        return {
            'response': False,
            'reason': 'Something went wrong while adding the document to the vector database. Check your secret file and try again.'
        }


@app.get('/db-data') # NOTE Need to handle the large data (FW), as all CRUD database operations are performed from this page through different routes.
async def load_documents_from_db(response: Response):
    try:
        kb = list_documents()

        if not kb:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {
                'response': False,
                'reason': "No data is available to load"
            }

        table = kb.search().to_list()

        if not table:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {
                'response': False,
                'reason': "No documents found in the database. Please add a document and try again."
            }
        return {
            'response': True,
            'result': table
        } 
    
    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        print(f"[ERROR]: Failed to load database data: {e}")
        return {
            'response': False,
            'reason': 'Unable to load data. Please try again'
        }
    

@app.post("/filter")
async def filter_data(body: MeatadataFilter, response: Response):

    result = search_document_through_metadata(
        file_name = body.file_name,
        file_type = body.file_type,
        source = body.source,
        update_by_user = body.update_by_user
    )

    if isinstance(result, list):
        return {
            'response': True,
            'result': result
        }

    elif result == 404:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {
            'response': False,
            'reason': "No document was found matching your request." 
        }
    elif result == 422:
        response.status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
        return{
            'response': False,
            'reason': 'Invalid document metadata. Please check the metadata and try again.'
        }
    elif not result:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            'response': False,
            'reason': "We encountered an unexpected error and couldn't process your request. Please try again later."
        }
    else:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return{
            'response': False,
            'reason': 'An unexpected error prevented us from generating the output. Please try again.'
        }


# Operations for documents
@app.delete("/documents") # NOTE: Whenever a document is deleted, we refresh '/listDB' to ensure that only documents currently present in the database are displayed.
async def operation_delete(
    body: DeleteRequest,
    response: Response
)-> dict:
    
    result = delete_document(body.ids)

    if result == 404:
        response.status_code = status.HTTP_404_NOT_FOUND
        return{
            'response': False,
            'result': "No data available to remove from the database."
        }
    elif not result:
        response.status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
        return{
            'response': False,
            'reason': 'Document not found or could not be removed. Please verify the document ID and try again.'
        }
    else:
        if result.num_deleted_rows == 0:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {
                'response': False,
                'reason': "No document with the specified ID was found."
            }
        else:
            return {
                'response': True,
                'result': f'Successfully removed {result.num_deleted_rows} documents.'
            }


@app.patch("/update_document") # Update the displayed document list instantly after a successful operation, without requiring a manual refresh.
async def update_document_through_id(body: UpdateDocument, response: Response):

    result = update_document(
        id= body.doc_id,
        update_content= body.updated_pageContent

    )

    if result == 503:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            'response': False,
            'reason': 'Embedding model is unavailable. Please initialize it before attempting an update.'
        }
    elif result == None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {
            'response': False,
            'reason': 'No data found to update.'
        }        
    elif result == 404:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {
            'response': False,
            'reason': "We couldn't find the document you're looking for."
        }
    elif result == 409:
        response.status_code = status.HTTP_409_CONFLICT
        return {
            'response': False,
            'reason': "Invalid input. Please verify your data and try again."
        }
    elif result == 500:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            'response': False,
            'reason': 'An unexpected error occurred while Updating document.'
        }
    else:
        if result == "done":
            return {
                'response': True,
                'result': 'Document updated successfully.'
            }


@app.get("/health")
async def health():
    return {
        "chat_model": chat_model is not None,
        "embedding_model": embedding_model is not None,
        "vectordb": vectordb is not None,
        "agent": ai_agent is not None,
    }
