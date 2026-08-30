import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useProjectContext } from "../App";

export default function DocumentUpdatePage() {

    const { setDisplayMessage } = useProjectContext();
    const { id: docID } = useParams();

    return (
        <>
            <h2>Hello from updating page!</h2>
            <h3>Your Selected Id: {docID}</h3>
        </>
    )

}