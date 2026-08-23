import lancedb, os
from platformdirs import user_data_dir

app_data_path = user_data_dir(
    appname="com.vishwjeet.personal-knowledge-hub", appauthor=False
)
full_path = os.path.join(app_data_path, "vector_db")

lancedb_object = lancedb.connect(full_path)