// Project context
import { useProjectContext } from "../App";

export default function BackendOverview() {

    const { backendStatus } = useProjectContext();

    return (
        <div>
            <h2>System status</h2>
            <div>
                <p>Backend Helth: {backendStatus.backend ? "Connected": "Not Ready"}</p>
                <p>Chat model: {backendStatus.models ? "Connected": "Not loaded"}</p>
                <p>Embedding model: {backendStatus.models ? "Connected": "Not loaded"}</p>
                <p>Vector database: {backendStatus.vectorDB ? "Connected": "Not loaded"}</p>
                <p>Retrieval agent: {backendStatus.agent ? "Connected": "Not loaded"}</p>
            </div>
        </div>
    );
}