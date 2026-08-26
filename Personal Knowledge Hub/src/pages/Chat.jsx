import { useState } from "react"
import { useProjectContext } from "../App";

export default function Chat() {
    const [modelResponse, setModelResponse] = useState("");
    const [userInput, setUserInput] = useState("");

    const { backendStatus } = useProjectContext();

    const makeRequest = async () => {
        try {
            setModelResponse("Working..")
            const modelOutput = await fetch("http://localhost:8000/chat",
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
            }

            console.error(responseData.CM);
            setModelResponse(responseData.UM);

        } catch (error) {

            console.error(error)
            setModelResponse("Unable to generate response.")
        }

    }

    return (
        <>
            <h2>Hellow from Chat page!</h2>
            <input value={userInput} placeholder="Enter your query" onChange={(e) => setUserInput(e.target.value)} />
            <button onClick={makeRequest} disabled={backendStatus.models === false}>Send</button>
            {modelResponse}
        </>
    )
}