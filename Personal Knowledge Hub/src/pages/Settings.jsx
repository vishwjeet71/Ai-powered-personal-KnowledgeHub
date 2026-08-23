import { useState } from "react";

// components
import ModelConfiguration from "../components/ModelConfiguration";

export default function Settings() {
    const [message, setMessage] = useState("");

    return (
        <>
            <div>
                <ModelConfiguration message={message} setMessage={setMessage} />
                <div>{message}</div>
            </div>
        </>
    )
}
