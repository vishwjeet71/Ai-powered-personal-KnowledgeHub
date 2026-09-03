// Project context
import { useProjectContext } from "../App";

export default function BackendOverview() {

    const { backendStatus } = useProjectContext();

    return (
        <section className="panel backend-overview">
            <h2 className="panel__title">System status</h2>
            <div className="status-grid">
                <div className="status-row">
                    <span className="status-row__label">Backend Helth</span>
                    <span className={`status-pill ${backendStatus.backend ? "status-pill--online" : "status-pill--offline"}`}>
                        {backendStatus.backend ? "Connected" : "Not Ready"}
                    </span>
                </div>
                <div className="status-row">
                    <span className="status-row__label">Chat model</span>
                    <span className={`status-pill ${backendStatus.models ? "status-pill--online" : "status-pill--offline"}`}>
                        {backendStatus.models ? "Connected" : "Not loaded"}
                    </span>
                </div>
                <div className="status-row">
                    <span className="status-row__label">Embedding model</span>
                    <span className={`status-pill ${backendStatus.models ? "status-pill--online" : "status-pill--offline"}`}>
                        {backendStatus.models ? "Connected" : "Not loaded"}
                    </span>
                </div>
                <div className="status-row">
                    <span className="status-row__label">Vector database</span>
                    <span className={`status-pill ${backendStatus.vectorDB ? "status-pill--online" : "status-pill--offline"}`}>
                        {backendStatus.vectorDB ? "Connected" : "Not loaded"}
                    </span>
                </div>
                <div className="status-row">
                    <span className="status-row__label">Retrieval agent</span>
                    <span className={`status-pill ${backendStatus.agent ? "status-pill--online" : "status-pill--offline"}`}>
                        {backendStatus.agent ? "Connected" : "Not loaded"}
                    </span>
                </div>
            </div>
        </section>
    );
}