from unittest.mock import patch, MagicMock
from backend.llms.gemini import googleChatModel, googleEmbeddingModel
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

# test code for Google LLM integration

class Test_object_validation:

    def test_chat_model(self):
        result = googleChatModel(api_key= "xyz")
        assert isinstance(result, ChatGoogleGenerativeAI) 

    def test_embedding_model(self):
        result = googleEmbeddingModel(api_key= "xyz")
        assert isinstance(result, GoogleGenerativeAIEmbeddings)


class Test_communication:

    @patch("backend.llms.gemini.ChatGoogleGenerativeAI")
    def test_chat_model(self, mock_class):

        googleChatModel(api_key= "xyz")

        mock_class.assert_called_once_with(
            api_key = "xyz",
            model= "gemini-3-flash-preview"
        )

    @patch("backend.llms.gemini.GoogleGenerativeAIEmbeddings")
    def test_embedding_model(self, mock_class):

        googleEmbeddingModel("xyz")
        
        mock_class.assert_called_once_with(
            api_key = "xyz",
            model = "gemini-embedding-001"
        )    

class Test_output:

    @patch("backend.llms.gemini.ChatGoogleGenerativeAI")
    def test_chat_model_output(self, mock_class):
        fake_output = MagicMock()
        fake_output.invoke.return_value = {
            "content": "hello!"
        }

        mock_class.return_value = fake_output

        model = googleChatModel("xyz")
        result = model.invoke("hii")

        assert result == {
            "content": "hello!"
        }

    @patch("backend.llms.gemini.GoogleGenerativeAIEmbeddings")
    def test_embedding_model_output(self, mock_class):
        embedding_mock = MagicMock()

        embedding_mock.embed_documents.return_value = [[0.0], [1.0]]
        embedding_mock.embed_query.return_value = [0.0]

        mock_class.return_value = embedding_mock
        model = googleEmbeddingModel("xyz")

        doc = model.embed_documents(["the", "india"])
        query = model.embed_query("hii")

        assert doc == [[0.0],[1.0]]
        assert query == [0.0]