import { open } from "@tauri-apps/plugin-dialog";

// Context
import { useProjectContext } from "../App";

export default function AddDocuments({ onDocumentAdded }) {

    const { setDisplayMessage, backendStatus } = useProjectContext();

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
                await makeAddRequest(filePath, setDisplayMessage, onDocumentAdded);
            }
        } catch (err) {
            console.error("Error selecting file:", err);
        }
    };

    return (
        <button onClick={handleSelectFile} disabled={backendStatus.vectorDB === false}>
            Select File
        </button>
    );
}

const makeAddRequest = async (filePath, setDisplayMessage, onDocumentAdded) => {

    try {
        const encodedPath = encodeURIComponent(filePath);
        const response = await fetch(`http://localhost:8000/share-resources?path=${encodedPath}`, {
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
}