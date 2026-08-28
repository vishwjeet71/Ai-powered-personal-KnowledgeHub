import { open } from "@tauri-apps/plugin-dialog";

export default function SelectFile() {
    const handleSelectFile = async () => {

        try {

            const filePath = await open({
                multiple: false,
                directory: false,
                filters: [
                    {
                        name: "Documents",
                        extensions: ["pdf", "txt", "docx"],
                    },
                ],
            });


            if (filePath === null) {
                console.log("User cancelled the file selection");
            } else {
                console.log("Selected file path:", filePath);
            }
        } catch (err) {
            console.error("Error selecting file:", err);
        }
    };

    return (
        <button onClick={handleSelectFile}>
            Select File
        </button>
    );
}