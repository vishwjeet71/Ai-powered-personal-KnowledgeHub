import { useState, useEffect } from "react";
import { DocumentCard } from "../components/DocumentCard";
import AddDocuments from "../components/AddDocuments";

export default function KnowledgeBase() {
    const [userDocuments, setUserDocuments] = useState([]);
    const [statusMessage, setStatusMessage] = useState("Loading..."); // Used for text messages
    const [pageNo, setPageNo] = useState(1);
    const [loadMore, setLoadMore] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch(`http://localhost:8000/get_documents?pageNo=${pageNo}`, {
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
        <>
            <h2>Hello from KnowledgeBase!</h2>

            {statusMessage && <div>{statusMessage}</div>}

            <div>
                {userDocuments.map((doc) => (
                    <DocumentCard
                        key={doc.id}
                        id={doc.id}
                        text={doc.text}
                        source={doc.metadata?.file_type}
                        file_name={doc.metadata?.file_name}
                    />
                ))}
            </div>

            {loadMore && (
                <button onClick={() => loadAnotherPage(setPageNo)}>
                    Load More
                </button>
            )}
            <div>
                <AddDocuments onDocumentAdded={refreshDocuments} />
            </div>
        </>
    );
}

const loadAnotherPage = (setPageNo) => {
    setPageNo(prevPageNo => prevPageNo + 1);
};