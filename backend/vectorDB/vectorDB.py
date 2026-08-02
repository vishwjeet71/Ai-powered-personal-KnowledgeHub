import lancedb
from langchain_core.documents import Document
from backend.vectorDB.secret import load_secrets

lancedb_object = lancedb.connect("./backend/vectorDB/vector_db")

# Listing operation
def list_documents():
    try:
        table = lancedb_object.open_table("knowledge_base")
        return table
    
    except ValueError:
        return None 


# search operation
def build_query(file_type=None, file_name=None, source=None, update_by_user=None):
    conditions = []

    if file_type is not None:
        conditions.append(f"metadata.file_type = '{file_type}'")

    if file_name is not None:
        conditions.append(f"metadata.file_name = '{file_name}'")

    if source is not None:
        conditions.append(f"metadata.source = '{source}'")

    if update_by_user is not None:
        conditions.append(f"metadata.update_by_user = '{update_by_user}'")

    return " AND ".join(conditions)


def search_document_through_metadata(*args, **kwargs):
    query = build_query(*args, **kwargs)
    table = list_documents()

    if not table:
        return 404

    try:
        matching_docs = (
            table.search()
            .where(query)
            .to_list()
        )
        if not matching_docs:
            return 404
        else:
            return matching_docs 
    
    except RuntimeError as re:
        print(f"[Error]: Runtime error during metadata validation: {re}")
        return 422
    
    except Exception as e:
        print(f"[Error]; An unexpected error occurred while filtering documents: {e}") 
        return None
    

# Deleting operation
def delete_document(
        ids: list[str]
):
    table = list_documents()

    if not table:
        return 404

    if not table.search().to_list():
        return 404

    try:
        ids_to_remove = ", ".join(f"'{id}'" for id in ids)
        result = table.delete(f"id IN ({ids_to_remove})")

        return result

    except ValueError as ve:
        print(f"[Error]: Invalid ID format or type mismatch: {ve}")
        return None
    
    except RuntimeError as re:
        print(f"[Error]: Database execution error during ID lookup: {re}")
        return None
    
    except Exception as e:
        print(f"[Error]: An unexpected error occurred while deleting documents from the database: {e}")
        return None


# updating document
def update_document(id: str, update_content: str):

    _ , embedding_model = load_secrets()

    if not embedding_model:
        return 503

    table = list_documents()

    if not table:
        return None
    
    else:
        try:
            existing_docs = table.search().where(f"id = '{id}'").to_list()

            if len(existing_docs) == 1:
                existing_metadata = existing_docs[0].get('metadata', {})
                existing_metadata['update_by_user'] = "Y"

                updated_record = {
                    "id": id,
                    "vector": embedding_model.embed_query(update_content),
                    "text": update_content,
                    "metadata": existing_metadata
                }

                table.merge_insert(on="id").when_matched_update_all().execute([updated_record])
                return 'done'
            
            elif len(existing_docs) == 0:
                return 404 

            else:
                return 409 
            
        except Exception as e:
            print(f"[Error]: An unexpected error occurred while Updating document: {e}")
            return 500