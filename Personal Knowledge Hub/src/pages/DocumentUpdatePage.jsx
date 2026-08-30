import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useProjectContext } from "../App";

// Function
import requestForDocument from "../Functions/requestForDocument";

export default function DocumentUpdatePage() {

    const { setDisplayMessage } = useProjectContext();
    const { id: docID } = useParams();
    const [docData, setDocData] = useState(null);
    const [docText, setDocText] = useState("");

    useEffect(() => {

        requestForDocument(docID, setDisplayMessage).then(data => {
            if (data) {
                setDocData(data);
                setDocText(data?.text)
            }
        });
    }, [docID, setDisplayMessage]);

    if (!docData) {
        return <h2>Loading document details...</h2>;
    }

    const handleUpdateRequest = async (e) => {
        e.preventDefault();
    }

    return (
        <main>
            <header>
                <h1>Document Details</h1>
            </header>

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

                    <button type="submit">
                        Update
                    </button>
                </form>
            </section>
        </main>
    );
}