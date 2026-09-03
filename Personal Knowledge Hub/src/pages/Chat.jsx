import { useState } from "react"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useProjectContext } from "../App";

export default function Chat() {
    const [modelResponse, setModelResponse] = useState("");
    const [userInput, setUserInput] = useState("");

    const { backendStatus, portNumber } = useProjectContext();

    const makeRequest = async () => {
        try {
            setModelResponse("Working..")
            const modelOutput = await fetch(`http://localhost:${portNumber}/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({ "query": userInput })
                }
            );

            const responseData = await modelOutput.json();

            if (modelOutput.ok) {

                setModelResponse(responseData);

            } else {

                console.error(responseData.CM);
                setModelResponse(responseData.UM);
            }


        } catch (error) {

            console.error(error)
            setModelResponse("Unable to generate response.")
        }

    }

    return (
        <div className="page chat-page">
            <header className="page-header">
                <h1 className="page-header__title">Hello from Chat page!</h1>
            </header>

            <div className="chat-page__response" aria-live="polite">
                <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {modelResponse}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="chat-page__composer">
                <input
                    className="chat-page__input"
                    value={userInput}
                    placeholder="Enter your query"
                    onChange={(e) => setUserInput(e.target.value)}
                />

                <button
                    className="btn btn--primary"
                    onClick={makeRequest}
                    disabled={backendStatus.models === false || modelResponse === "Working.."}
                >
                    Send
                </button>
            </div>
        </div>
    );
}