import { useState } from "react"

export default function Chat() {
    const [modelResponse, setModelResponse] = useState("");
    const [userInput, setUserInput] = useState("");

    const makeRequest = async () => {
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

        const data = await modelOutput.json(); 

        setModelResponse(data);
    }

    return (
        <>
            <h2>Hellow from Chat page!</h2>
            <input value={userInput} placeholder="Enter your query" onChange={(e) => setUserInput(e.target.value)} />
            <button onClick={makeRequest}>Send</button>
            {modelResponse}
        </>
    )
}