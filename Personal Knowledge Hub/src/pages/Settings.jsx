import { useState } from "react";

// components
import ModelConfiguration from "../components/ModelConfiguration";

export default function Settings() {
    const [displayMessage, setDisplayMessage] = useState("");

    return (
        <>
            <div>
                <ModelConfiguration setDisplayMessage= {setDisplayMessage} />
                <div>{displayMessage}</div>
            </div>
        </>
    )
}
