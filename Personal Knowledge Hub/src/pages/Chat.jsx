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
        <div className="chat-container">
            <h2>Hello from Chat page!</h2>

            <div className="input-area">
                <input
                    value={userInput}
                    placeholder="Enter your query"
                    onChange={(e) => setUserInput(e.target.value)}
                />

                <button
                    onClick={makeRequest}
                    disabled={backendStatus.models === false || modelResponse === "Working.."}
                >
                    Send
                </button>
            </div>

            <div className="model-response">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {modelResponse}
                </ReactMarkdown>
            </div>
        </div>
    );
}