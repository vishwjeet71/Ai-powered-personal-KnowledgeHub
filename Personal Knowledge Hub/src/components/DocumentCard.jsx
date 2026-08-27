export const DocumentCard = ({ id, text, source, file_name }) => {
    return (
        <div>
            <p>{text}</p>
            <div>

                <p>File name: {file_name}</p>
                <p>Type: {source}</p>
                <button onClick={() => handleDelete(id)}>
                    Delete
                </button>
                <button onClick={() => handleUpdate(id)}>
                    Update
                </button>
            </div>
        </div>
    );
};