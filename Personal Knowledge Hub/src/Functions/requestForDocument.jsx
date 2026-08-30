export default async function requestForDocument(docID, setDisplayMessage) {
    try {

        const response = await fetch(`http://localhost:8000/get_document?docID=${docID}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const responseData = await response.json();
        const console_message = responseData.CM;
        const user_message = responseData.UM;

        if (response.ok && user_message?.constructor === Object) {

            console.log(console_message);
            return user_message;

        } else {

            setDisplayMessage(user_message);
            console.warn(console_message);
            return null;
        }

    } catch (err) {

        setDisplayMessage("Failed to Update! Try Again");
        console.error(`Failed to update Document: ${err}`);
        return null;
    }
}
