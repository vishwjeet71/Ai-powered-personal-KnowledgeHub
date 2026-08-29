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