import lancedb, os
from platformdirs import user_data_dir

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
            return "You have no Documents!"

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
