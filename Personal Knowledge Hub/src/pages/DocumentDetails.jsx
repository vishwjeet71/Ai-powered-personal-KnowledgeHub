import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

// Function
import requestForDocument from "../Functions/requestForDocument";

//project Context
import { useProjectContext } from "../App";

export default function DocumentDetailsPage() {

    const { setDisplayMessage, portNumber } = useProjectContext();
    const { id: docID } = useParams();
    const [docData, setDocData] = useState(null);

    useEffect(() => {

        requestForDocument(docID, setDisplayMessage, portNumber).then(data => {
            if (data) {
                setDocData(data);
            }
        });
    }, []);

    if (!docData) {
        return (
            <div className="page loading-state">
                <p className="loading-state__text">Loading document details...</p>
            </div>
        );
    }

    return (
        <div className="page document-details-page">
            <header className="page-header">
                <h1 className="page-header__title">Document Details</h1>
                <p className="page-header__meta mono">ID: {docID}</p>
            </header>

            <section className="panel">
                <dl className="detail-list">
                    <div className="detail-list__row">
                        <dt>PRODUCER:</dt>
                        <dd>{docData.metadata.producer || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>CREATOR:</dt>
                        <dd>{docData.metadata.creator || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>CREATION DATE:</dt>
                        <dd className="mono">{docData.metadata.creationdate || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>SOURCE:</dt>
                        <dd>{docData.metadata.source || "undefined"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>FILE PATH:</dt>
                        <dd className="mono">{docData.metadata.file_path || "Path Not Available"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>PAGES:</dt>
                        <dd>{docData.metadata.page || "NULL"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>TOTAL PAGES:</dt>
                        <dd>{docData.metadata.total_pages || "NULL"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>FORMAT:</dt>
                        <dd>{docData.metadata.format || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>AUTHOR:</dt>
                        <dd>{docData.metadata.author || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>MOD DATE:</dt>
                        <dd className="mono">{docData.metadata.moddate || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>FILE NAME:</dt>
                        <dd>{docData.metadata.file_name || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>FILE TYPE:</dt>
                        <dd>{docData.metadata.file_type || "Unknown"}</dd>
                    </div>
                    <div className="detail-list__row">
                        <dt>UPDATE BY USER:</dt>
                        <dd>{docData.metadata.update_by_user ? "YES" : "NO"}</dd>
                    </div>
                </dl>

                <p className="document-details-page__body">TEXT: {docData.text ? docData.text : "No TEXT"}</p>
            </section>
        </div>
    );
}