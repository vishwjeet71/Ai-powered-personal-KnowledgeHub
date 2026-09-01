import { useEffect, useRef } from "react";
import { useProjectContext } from "../App";

export default function BackendError() {
    const { backendStatus, setBackendStatus, portNumber } = useProjectContext();

    const retryCount = useRef(0);

    const makeHelthCheckRequest = async () => {
        try {
            const response = await fetch(`http://localhost:${portNumber}/health`);

            if (!response.ok) {
                throw new Error("Health check failed");
            }

            const responseData = await response.json();

            // Reset retries on a successful response
            retryCount.current = 0;

            setBackendStatus({
                backend: responseData.backend,
                models: responseData.models,
                agent: responseData.agent,
                vectorDB: responseData.vectorDB
            });
        } catch (error) {
            if (retryCount.current < 3) {
                retryCount.current += 1;
                setTimeout(makeHelthCheckRequest, 5000);

            } else {
                setBackendStatus({
                    backend: false,
                    models: false,
                    agent: false,
                    vectorDB: false
                });
                console.log("Max retries reached. Waiting for next 30s interval.");
            }
        }
    }

    useEffect(() => {

        makeHelthCheckRequest();

        const intervalId = setInterval(makeHelthCheckRequest, 30000);

        // Cleanup interval
        return () => clearInterval(intervalId);
    }, []);

    return (
        <header>
            {backendStatus.backend === false && (
                <h3>Backend {backendStatus.backend}</h3>
            )}
            {backendStatus.models === false && (
                <h3>Models {backendStatus.models}</h3>
            )}
            {backendStatus.agent === false && (
                <h3>AI Agent {backendStatus.agent}</h3>
            )}
            {backendStatus.vectorDB === false && (
                <h3>Vectordb {backendStatus.vectorDB}</h3>
            )}
        </header>
    )
}
