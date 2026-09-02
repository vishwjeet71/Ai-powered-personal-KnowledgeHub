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
        return <h2>Loading document details...</h2>;
    }

    return (
        <>
            <h2>Document Details</h2>
            <h2>ID: {docID}</h2>
            <div>
                <p>PRODUCER: {docData.metadata.producer || "Unknown"} </p>
                <p>CREATOR: {docData.metadata.creator || "Unknown"}</p>
                <p>CREATION DATE: {docData.metadata.creationdate || "Unknown"} </p>
                <p>SOURCE: {docData.metadata.source || "undefined"} </p>
                <p>FILE PATH: {docData.metadata.file_path || "Path Not Available"} </p>
                <p>PAGES: {docData.metadata.page || "NULL"} </p>
                <p>TOTAL PAGES: {docData.metadata.total_pages || "NULL"} </p>
                <p>FORMAT: {docData.metadata.format || "Unknown"} </p>
                <p>AUTHOR: {docData.metadata.author || "Unknown"} </p>
                <p>MOD DATE: {docData.metadata.moddate || "Unknown"} </p>
                <p>FILE NAME: {docData.metadata.file_name || "Unknown"} </p>
                <p>FILE TYPE: {docData.metadata.file_type || "Unknown"} </p>
                <p>UPDATE BY USER: {docData.metadata.update_by_user ? "YES" : "NO"} </p>
                <p>TEXT: {docData.text ? docData.text : "No TEXT"} </p>
            </div>
        </>
    );
}