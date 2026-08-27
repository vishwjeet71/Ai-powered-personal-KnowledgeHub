import { useState, useEffect } from "react";

export default function KnowledgeBase() {
    const [pageContent, setPageContent] = useState("Loading...");
    const [pageNo, setPageNo] = useState(1);

    useEffect(() => {
        const featchDocuments = async () => {
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
                        setPageContent("Content load successfully!");
                        console.log(console_message);
                    } else {
                        setPageContent(user_message);
                        console.log(console_message);
                    }
                }
            } catch (error) {
                setPageContent("Failed to load Documents");
                console.error(`Loading Document failed ${error}`);
            }
        };

        featchDocuments();
    }, [pageNo]);

    return (
        <>
            <h2>Hello from KnowledgeBase!</h2>
            {pageContent}
        </>
    );
}