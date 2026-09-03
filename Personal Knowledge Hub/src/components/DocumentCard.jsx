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
        <article className="document-card">
            <p className="document-card__text">{text}</p>

            <div className="document-card__meta">
                <span className="document-card__meta-item">File name: {file_name}</span>
                <span className="document-card__meta-item">Type: {source}</span>
            </div>

            <div className="document-card__actions">
                <button className="btn btn--danger-outline btn--small" onClick={handleDelete}>
                    <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
                    </svg>
                    <span>Delete</span>
                </button>

                <button className="btn btn--outline btn--small" onClick={() => navigate(`/documents/${id}`)}>
                    <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 15v5Z" />
                    </svg>
                    <span>Update</span>
                </button>

                <button className="btn btn--outline btn--small" onClick={() => navigate(`/getDocumentDetails/${id}`)} >
                    <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.5" />
                        <line x1="12" y1="11" x2="12" y2="16" />
                        <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
                    </svg>
                    <span>More Details</span>
                </button>
            </div>
        </article>
    );
};