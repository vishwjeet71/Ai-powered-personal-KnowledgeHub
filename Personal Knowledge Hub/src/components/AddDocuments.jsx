import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

// Context
import { useProjectContext } from "../App";

export default function AddDocuments({ onDocumentAdded, setIsAdding, isAdding }) {

    const { setDisplayMessage, backendStatus, portNumber } = useProjectContext();

    const handleSelectFile = async () => {

        try {

            const filePath = await open({
                multiple: false,
                directory: false,
                filters: [
                    {
                        name: "Documents",
                        extensions: ["pdf"],
                    },
                ],
            });


            if (filePath === null) {
                console.log("User cancelled the file selection");
            } else {
                await makeAddRequest(filePath, setDisplayMessage, onDocumentAdded, setIsAdding, portNumber);
            }
        } catch (err) {
            console.error("Error selecting file:", err);
        }
    };

    return (
        <button onClick={handleSelectFile} disabled={backendStatus.vectorDB === false || isAdding === "Adding your Documents..."}>
            Select File
        </button>
    );
}

const makeAddRequest = async (filePath, setDisplayMessage, onDocumentAdded, setIsAdding, portNumber) => {

    setIsAdding("Adding your Documents...");

    try {
        const encodedPath = encodeURIComponent(filePath);
        const response = await fetch(`http://localhost:${portNumber}/share-resources?path=${encodedPath}`, {
            method: "GET"
        });

        const responseData = await response.json();
        const console_message = responseData.CM
        const user_message = responseData.UM

        if (response.ok) {

            setDisplayMessage(user_message);
            console.log(console_message);

            onDocumentAdded();
        } else {

            setDisplayMessage(user_message);
            console.warn(console_message);
        }
    } catch (err) {

        setDisplayMessage("Failed to save!");
        console.error(`Document failed: ${err}`);

    }

    setIsAdding("");
}