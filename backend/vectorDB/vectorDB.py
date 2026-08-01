import lancedb

lancedb_object = lancedb.connect("./backend/vectorDB/vector_db")

# Listing operation
def list_documents():
    return lancedb_object.open_table("knowledge_base")

# search operation
def build_query(file_type=None, file_name=None, source=None):
    conditions = []

    if file_type is not None:
        conditions.append(f"metadata.file_type = '{file_type}'")

    if file_name is not None:
        conditions.append(f"metadata.file_name = '{file_name}'")

    if source is not None:
        conditions.append(f"metadata.source = '{source}'")

    return " AND ".join(conditions)

def search_document_through_metadata(*args, **kwargs):
    query = build_query(*args, **kwargs)
    table = list_documents()

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
        print(f"[Error]; An unexpected error occurred while filtering documents: {e}") #  Something went wrong while filtering the documents. Please try again.
        return None
    

# Deleting operation
def delete_document(
        ids: list[str]
):
    table = list_documents()

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
def update_document():
    pass