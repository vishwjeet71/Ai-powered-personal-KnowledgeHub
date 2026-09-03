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
        <header className="status-alert">
            <ul className="status-alert__list">
                {backendStatus.backend === false && (
                    <li className="status-alert__item">
                        <span className="status-alert__dot" aria-hidden="true"></span>
                        <h3 className="status-alert__text">Backend {backendStatus.backend}</h3>
                    </li>
                )}
                {backendStatus.models === false && (
                    <li className="status-alert__item">
                        <span className="status-alert__dot" aria-hidden="true"></span>
                        <h3 className="status-alert__text">Models {backendStatus.models}</h3>
                    </li>
                )}
                {backendStatus.agent === false && (
                    <li className="status-alert__item">
                        <span className="status-alert__dot" aria-hidden="true"></span>
                        <h3 className="status-alert__text">AI Agent {backendStatus.agent}</h3>
                    </li>
                )}
                {backendStatus.vectorDB === false && (
                    <li className="status-alert__item">
                        <span className="status-alert__dot" aria-hidden="true"></span>
                        <h3 className="status-alert__text">Vectordb {backendStatus.vectorDB}</h3>
                    </li>
                )}
            </ul>
        </header>
    )
}
