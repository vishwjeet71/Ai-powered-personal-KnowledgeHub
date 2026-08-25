import { useEffect, useRef } from "react";
import { useProjectContext } from "../App";

export default function BackendError() {
    const { backendStatus, setBackendStatus } = useProjectContext();
    
    const retryCount = useRef(0);

    const makeHelthCheckRequest = async () => {
        try {
            const response = await fetch("http://localhost:8000/health");

            if (!response.ok) {
                throw new Error("Health check failed");
            }

            const responseData = await response.json();

            // Reset retries on a successful response
            retryCount.current = 0;

            setBackendStatus({
                backend: responseData.backend,
                models: responseData.models,
                vectorDB: responseData.vectorDB
            }); 
        } catch (error) {
            if (retryCount.current < 3) {
                retryCount.current += 1;
                setTimeout(makeHelthCheckRequest, 5000);

            } else {
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
                <h>Backend {backendStatus.backend}</h>
            )}
            {backendStatus.models === false && (
                <h>Models {backendStatus.models}</h>
            )}
            {backendStatus.vectorDB === false && (
                <h>Vectordb {backendStatus.vectorDB}</h>
            )}
        </header>
    )
}
