# NOTE metadata_preprocessing is defined in the PDF module and is reused by every document loader
# to ensure consistent metadata processing across all supported file types.

from backend.documentLoaders.pdfLoader import classify_pdf

def load_document_file(path_of_file: str, source: str):
  # extract info
  file_name = path_of_file.split("/")[-1]
  file_type = path_of_file.split(".")[-1]
  source = source

  if source == "local":

    if file_type == "pdf":
      return classify_pdf(pdf_path=path_of_file, file_name=file_name, file_type=file_type, source=source) # None If something wrong happened
    
    if file_type in ("doc", "docx"):
      print("[Info]: Doc Method called Succesfully")
      return 503 # Service Unavailable

    else:
      print("[Info]: Invlid Document in local")
      return 501 

  elif source == "web":

    if file_type == 'html':
      print("[Info]: web page method called succesfully")
      return 503 # Service Unavailable

    if file_type == 'vvt':
      print("[Info]: youtub transcript method called succesfully")
  
  else: 
    return 501 # Invalid document