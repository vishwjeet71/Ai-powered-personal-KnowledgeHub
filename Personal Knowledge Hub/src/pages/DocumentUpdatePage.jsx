import { useParams, Link } from "react-router-dom";
import { useState, useEffect, use } from "react";
import { useProjectContext } from "../App";

// Function
import requestForDocument from "../Functions/requestForDocument";

export default function DocumentUpdatePage() {

    const { setDisplayMessage, backendStatus } = useProjectContext();
    const { id: docID } = useParams();
    const [docData, setDocData] = useState(null);
    const [docText, setDocText] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {

        requestForDocument(docID, setDisplayMessage).then(data => {
            if (data) {
                setDocData(data);
                setDocText(data?.text)
            }
        });
    }, [docID]);

    if (!docData) {
        return <h2>Loading document details...</h2>;
    }

    const handleUpdateRequest = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {

            const response = await fetch("http://localhost:8000/update_document", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    doc_id: docID,
                    updated_pageContent: docText
                })
            });

            const responseData = await response.json();
            const console_message = responseData.CM;
            const user_message = responseData.UM;

            if (response.ok) {

                setDisplayMessage(user_message);
                console.log(console_message);
            } else {
                setDisplayMessage(user_message);
                console.warn(console_message);
            }
        } catch (err) {

            setDisplayMessage("Failed to Update!");
            console.error(`Update failed: ${err}`);
        } finally {

            setIsUpdating(false);

        }
    }

    return (
        <main>
            <header>
                <h1>Document Details</h1>
            </header>
            {isUpdating && (
                <div>
                    <h2>Updating...</h2>
                </div>
            )}

            <section aria-labelledby="file-details-heading">
                <h2 id="file-details-heading">File Information</h2>

                <dl>
                    <div>
                        <dt>File Name</dt>
                        <dd>{docData.metadata?.file_name || "Unknown"}</dd>
                    </div>

                    <div>
                        <dt>File Type</dt>
                        <dd>{docData.metadata?.file_type || "Unknown"}</dd>
                    </div>

                    <div>
                        <dt>Added / Updated Date</dt>
                        <dd>{docData.metadata?.moddate || "Unknown"}</dd>
                    </div>

                    <div>
                        <dt>Updated by User</dt>
                        <dd>
                            {String(docData.metadata?.update_by_user).toUpperCase()}
                        </dd>
                    </div>
                </dl>
            </section>

            <section aria-labelledby="document-editor-heading">
                <h2 id="document-editor-heading">Edit Document</h2>

                <form onSubmit={handleUpdateRequest}>
                    <div>
                        <label htmlFor="document-text">
                            Document Content
                        </label>

                        <textarea
                            id="document-text"
                            value={docText}
                            onChange={(e) => setDocText(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={isUpdating || backendStatus.vectorDB === false}>
                        {isUpdating ? "Updating..." : "Update"}
                    </button>
                </form>
            </section>
        </main>
    );
}