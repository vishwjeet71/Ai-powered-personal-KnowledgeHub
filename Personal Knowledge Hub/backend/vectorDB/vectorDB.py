import lancedb, os
from platformdirs import user_data_dir

# FastApi
from fastapi import Response, status

app_data_path = user_data_dir(
    appname="com.vishwjeet.personal-knowledge-hub", appauthor=False
)
full_path = os.path.join(app_data_path, "vector_db")

lancedb_object = lancedb.connect(full_path)


# Retrieve all documents from the vector database
def _list_documents():
    try:
        table = lancedb_object.open_table("knowledge_base")
        return table

    except ValueError:
        return None


def get_page_data(pageNo: int):

    end_p = int(f"{pageNo}0")
    strat_p = end_p - 10

    try:
        table = _list_documents()

        if not table:
            return {"CM": "Null dataBase", "UM": "You have no Documents!"}

        data = table.search().to_list()
        length_of_total_data = len(data)

    except Exception as e:
        return {
            "CM": f"Unable to load documents: {e}",
            "UM": "There is a problem while loading your documents!",
        }

    return {
        "CM": f"Page number {pageNo} data loaded successfully!",
        "UM": {
            "page_data": data[strat_p:end_p],
            "load_more": length_of_total_data - end_p > 0,
        },
    }


def delete_document(ids: list[str], response: Response):
    table = _list_documents()

    try:

        if (not table) or (not table.search().to_list()):
            response.status_code = status.HTTP_404_NOT_FOUND
            return {
                "CM": "No data available to remove from the database.",
                "UM": "There are no documents available to delete.",
            }

        ids_to_remove = ", ".join(f"'{id}'" for id in ids)
        result = table.delete(f"id IN ({ids_to_remove})")

        if not result:
            response.status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
            return {
                "CM": "Document not found or could not be removed. Please verify the document ID and try again.",
                "UM": "The document ID is invalid. Please provide a valid document ID.",
            }

        elif result.num_deleted_rows == 0:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {
                "CM": "No document with the specified ID was found.",
                "UM": "No document with the specified ID was found.",
            }

        else:
            return {
                "CM": f"Successfully removed document {ids}.",
                "UM": "The selected document were successfully deleted.",
            }

    except ValueError as ve:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "CM": f"[Error]: Invalid ID format or type mismatch: {ve}",
            "UM": "The document could not be deleted. Please check the document ID and try again.",
        }

    except RuntimeError as re:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "CM": f"[Error]: Database execution error during ID lookup: {re}",
            "UM": "The document could not be deleted. Please check the document ID and try again.",
        }

    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "CM": f"[Error]: An unexpected error occurred while deleting documents from the database: {e}",
            "UM": "Something went wrong while deleting the document(s). Please try again later.",
        }


def get_document_data(docID: str, response: Response):
    table = _list_documents()

    try:
        if (not table) or (not table.search().to_list()):
            response.status_code = status.HTTP_404_NOT_FOUND
            return {
                "CM": "Document lookup failed: the document database is empty.",
                "UM": "No documents are available. Please add a document and try again.",
            }

        result = table.search().where(f"id = '{docID}'").to_list()

        if len(result) == 0:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {
                "CM": f"Document lookup failed: no document found with ID '{docID}'.",
                "UM": "We couldn't find a document with the provided ID. Please check the ID and try again.",
            }

        return {
            "CM": f"Document retrieved successfully with ID '{docID}'.",
            "UM": result[0],
        }

    except Exception as E:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "CM": f"Document retrieval failed for ID '{docID}': {E}",
            "UM": "We couldn't retrieve the document due to an unexpected error. Please try again later.",
        }


# updating document
def update_document(id: str, update_content: str, embedding_model, response: Response):

    embedding_model = embedding_model

    if not embedding_model:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "CM": "The embedding model has not been initialized.",
            "UM": "Please provide valid credentials or check your existing credentials.",
        }

    table = _list_documents()

    if not table:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {
            "CM": "The document database is empty.",
            "UM": "No documents are available. Please add a document and try again.",
        }

    else:
        try:
            existing_docs = table.search().where(f"id = '{id}'").to_list()

            if len(existing_docs) == 1:
                existing_metadata = existing_docs[0].get("metadata", {})
                existing_metadata["update_by_user"] = True

                updated_record = {
                    "id": id,
                    "vector": embedding_model.embed_query(update_content),
                    "text": update_content,
                    "metadata": existing_metadata,
                }

                table.merge_insert(on="id").when_matched_update_all().execute(
                    [updated_record]
                )
                return {
                    "CM": f"Document with ID '{id}' was updated successfully.",
                    "UM": "Document updated successfully!",
                }

            elif len(existing_docs) == 0:
                response.status_code = status.HTTP_404_NOT_FOUND
                return {
                    "CM": f"No document was found with ID '{id}'.",
                    "UM": "The document ID is incorrect or does not exist.",
                }

            else:
                response.status_code = status.HTTP_409_CONFLICT  # try again
                return {
                    "CM": "Multiple documents were found with the same ID. The document could not be updated.",
                    "UM": "Something went wrong. Please try again.",
                }

        except Exception as e:
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return {
                "CM": f"An unexpected error occurred while updating the document: {e}",
                "UM": "Unable to update the document. Please try again later.",
            }
