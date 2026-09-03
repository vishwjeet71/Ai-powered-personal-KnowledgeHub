import { useState, useEffect } from "react";
import { DocumentCard } from "../components/DocumentCard";
import AddDocuments from "../components/AddDocuments";

// Project context
import { useProjectContext } from "../App";

export default function KnowledgeBase() {
    const [userDocuments, setUserDocuments] = useState([]);
    const [statusMessage, setStatusMessage] = useState("Loading Documents..."); // Used for text messages
    const [pageNo, setPageNo] = useState(1);
    const [loadMore, setLoadMore] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);
    const [isAdding, setIsAdding] = useState("");

    const { portNumber } = useProjectContext();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch(`http://localhost:${portNumber}/get_documents?pageNo=${pageNo}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const page_content = await response.json();
                    const console_message = page_content.CM;
                    const user_message = page_content.UM;

                    if (user_message?.constructor === Object) {
                        console.log(console_message);
                        setStatusMessage("");

                        if (pageNo === 1) {
                            setUserDocuments(user_message.page_data);
                        } else {
                            setUserDocuments(pd => [
                                ...pd,
                                ...user_message.page_data
                            ]);
                        }
                        setLoadMore(user_message.load_more);

                    } else {
                        setStatusMessage(user_message);
                        console.log(console_message);
                    }
                }
            } catch (error) {
                setStatusMessage("Failed to load Documents");
                console.error(`Loading Document failed ${error}`);
            }
        };

        fetchDocuments();
    }, [pageNo, refreshKey]);

    const refreshDocuments = () => { setRefreshKey(prev => prev + 1); };

    return (
        <div className="page knowledge-base-page">
            <header className="page-header">
                <h1 className="page-header__title">Hello from KnowledgeBase!</h1>
            </header>

            {isAdding && <div className="status-banner">{isAdding}</div>}
            {statusMessage && <div className="status-banner status-banner--muted">{statusMessage}</div>}

            <div className="document-grid">
                {userDocuments.map((doc) => (
                    <DocumentCard
                        key={doc.id}
                        id={doc.id}
                        text={doc.text}
                        source={doc.metadata?.file_type}
                        file_name={doc.metadata?.file_name}
                        onDocumentDeleted={refreshDocuments}
                    />
                ))}
            </div>

            {loadMore && (
                <div className="knowledge-base-page__load-more">
                    <button className="btn btn--outline" onClick={() => loadAnotherPage(setPageNo)}>
                        Load More
                    </button>
                </div>
            )}

            <div className="knowledge-base-page__toolbar">
                <AddDocuments
                    onDocumentAdded={refreshDocuments}
                    isAdding={isAdding}
                    setIsAdding={setIsAdding} />
            </div>
        </div>
    );
}

const loadAnotherPage = (setPageNo) => {
    setPageNo(prevPageNo => prevPageNo + 1);
};