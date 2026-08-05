import fitz  # PyMuPDF
from langchain_community.document_loaders import PyMuPDFLoader

def update_metadata(
    org_metadata: dict,
    file_name: str,
    file_type: str,
    source: str
) -> dict:
    updated_dict = {
        k: v
        for k, v in org_metadata.items()
        if v not in ("", None)
    }

    updated_dict.update({
        "file_name": file_name,
        "file_type": file_type,
        "source": source,
        "update_by_user": 'N'
    })

    return updated_dict


# common step
def metadata_preprocessing(func):

  def wrapper(*args, **kwargs):

    doc_list = func(*args, **kwargs)

    if doc_list == None:
      return None

    file_name = kwargs.get("file_name", "")
    file_type = kwargs.get("file_type", "")
    source = kwargs.get("source", "")
    

    for doc in doc_list:
      data = doc.metadata
      try:
        doc.metadata = update_metadata(
            org_metadata= data,
            file_name= file_name,
            file_type= file_type,
            source= source
        )
      except Exception as e:
        print(f"[Error] Unable to update metaData. For {file_name} ->{data['page']}")
        doc.metadata = data

    return doc_list

  return wrapper


@metadata_preprocessing
def classify_pdf(pdf_path: str, file_name: str, file_type: str, source: str) -> list:

  reader = fitz.open(pdf_path)
  total_pages = len(reader)

  if total_pages == 0:
    print("[INFO]: Empty PDF File, document contains 0 pages.")
    return None

  sample_pages = min(5, total_pages)
  total_text_length = 0
  has_table = False

  for i in range(sample_pages):
    page = reader[i]

    tables = page.find_tables()
    if len(tables.tables) > 0:
      has_table = True

    text = page.get_text() or ""
    total_text_length += len(text.strip())

    # Classification logic
    if total_text_length == 0:
      print("[INFO]: Scanned Image PDF")
      return 503 # "UnstructuredPDFLoader (with OCR)"

    elif has_table:
      print("[INFO]: Structured PDF (Contains Tables/Forms)")
      return 503 # "UnstructuredPDFLoader"

    else:
      print("[INFO]: Unstructured Text PDF (Paragraphs/Essays)")
      return PyMuPDFLoader(pdf_path).load()