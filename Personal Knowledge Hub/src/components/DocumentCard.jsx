import { useProjectContext } from "../App";
import { useNavigate } from "react-router-dom";

export const DocumentCard = ({
    id,
    text,
    source,
    file_name,
    onDocumentDeleted
}) => {

    const { setDisplayMessage, portNumber } = useProjectContext();
    const navigate = useNavigate();

    const handleDelete = async () => {
        try {
            const response = await fetch(
                `http://localhost:${portNumber}/documents`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ids: [id]
                    })
                }
            );

            const responseData = await response.json();

            const console_message = responseData.CM;
            const user_message = responseData.UM;

            if (response.ok) {

                setDisplayMessage(user_message);
                console.log(console_message);

                onDocumentDeleted();

            } else {

                setDisplayMessage(user_message);
                console.warn(console_message);
            }

        } catch (error) {
            setDisplayMessage("Failed to Delete.")
            console.error("Delete document failed:", error);
        }
    };

    return (
        <div>
            <p>{text}</p>
            <div>
                <p>File name: {file_name}</p>
                <p>Type: {source}</p>

                <button onClick={handleDelete}>
                    Delete
                </button>

                <button onClick={() => navigate(`/documents/${id}`)}>
                    Update
                </button>

                <button onClick={() => navigate(`/getDocumentDetails/${id}`)} >
                    More Details
                </button>
            </div>
        </div>
    );
};