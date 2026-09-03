import { useState } from "react";
import { BaseDirectory, exists, mkdir, remove, writeTextFile } from "@tauri-apps/plugin-fs";

import { useProjectContext } from "../App";

export default function ModelConfiguration() {

    const displayTime = 5000;
    const { setBackendStatus, setDisplayMessage, portNumber } = useProjectContext();
    const [formData, setFormData] = useState({
        api_provider: "openai",
        api_key: "",
        base_url: "",
        chat_model_name: "",
        embd_model_name: "",
    });


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanedFormData = JSON.stringify(
            Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [
                    key,
                    value === "" ? null : value
                ])
            )
        );

        try {
            // Make sure the app-specific config directory exists
            await mkdir("", {
                baseDir: BaseDirectory.AppConfig,
                recursive: true
            });

            // Write the file
            await writeTextFile(
                "secret.json",
                cleanedFormData,
                {
                    baseDir: BaseDirectory.AppConfig
                }
            );

            setDisplayMessage("File written successfully!");
            setTimeout(() => setDisplayMessage(""), displayTime)

            // load models request
            makeLoadRequest(
                { setDisplayMessage, setBackendStatus, portNumber }
            );

        } catch (error) {

            console.error("failed to write file:", error);
            setDisplayMessage("failed to write file.");
            setTimeout(() => setDisplayMessage(""), displayTime);
        }
    };

    const handleDelete = async () => {
        try {
            const options = { baseDir: BaseDirectory.AppConfig };
            const fileExists = await exists("secret.json", options);

            if (fileExists) {
                // Delete the file
                await remove("secret.json", options);

                setFormData({
                    api_provider: "openai",
                    api_key: "",
                    base_url: "",
                    chat_model_name: "",
                    embd_model_name: "",
                });

                // success message for 3 seconds
                setDisplayMessage("File deleted successfully!");
                setTimeout(() => setDisplayMessage(""), displayTime);

            } else {
                // "not found" message for 3 seconds
                setDisplayMessage("File does not exist.");
                setTimeout(() => setDisplayMessage(""), displayTime);
            }

            // load model request
            makeLoadRequest(
                { setDisplayMessage, setBackendStatus, portNumber }
            );

        } catch (error) {

            console.error("failed to remove secret file:", error);
            setDisplayMessage("failed to delete file.");
            setTimeout(() => setDisplayMessage(""), displayTime);
        }
    };


    return (
        <section className="panel model-configuration">
            <form className="form" onSubmit={handleSubmit}>
                <h2 className="panel__title">Model configuration</h2>

                <fieldset className="form__fieldset">
                    <legend className="form__legend">Provider</legend>

                    <label className="option-card">
                        <input
                            type="radio"
                            name="api_provider"
                            value="google"
                            checked={formData.api_provider === "google"}
                            onChange={handleChange}
                            className="option-card__input"
                        />
                        <span className="option-card__body">
                            <strong className="option-card__title">Google</strong>
                            <p className="option-card__description">Gemini chat + embeddings</p>
                        </span>
                    </label>

                    <label className="option-card">
                        <input
                            type="radio"
                            name="api_provider"
                            value="openai"
                            checked={formData.api_provider === "openai"}
                            onChange={handleChange}
                            className="option-card__input"
                        />
                        <span className="option-card__body">
                            <strong className="option-card__title">OpenAI</strong>
                            <p className="option-card__description">GPT chat + embeddings</p>
                        </span>
                    </label>

                    <label className="option-card">
                        <input
                            type="radio"
                            name="api_provider"
                            value="openai-compatible"
                            checked={formData.api_provider === "openai-compatible"}
                            onChange={handleChange}
                            className="option-card__input"
                        />
                        <span className="option-card__body">
                            <strong className="option-card__title">OpenAI-compatible</strong>
                            <p className="option-card__description">Custom base URL, e.g. a local server</p>
                        </span>
                    </label>
                </fieldset>

                <div className="form__field">
                    <label htmlFor="api-key" className="form__label">API key</label>
                    <input
                        type="password"
                        id="api-key"
                        name="api_key"
                        value={formData.api_key}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        className="form__input"
                    />
                </div>

                {formData.api_provider === "openai-compatible" && (
                    <fieldset className="form__fieldset form__fieldset--nested">
                        <legend className="form__legend">Custom Provider Details</legend>

                        <div className="form__field">
                            <label htmlFor="base-url" className="form__label">Base URL</label>
                            <input
                                type="text"
                                id="base-url"
                                name="base_url"
                                value={formData.base_url}
                                onChange={handleChange}
                                placeholder="https://example.com"
                                className="form__input"
                            />
                        </div>

                        <div className="form__field">
                            <label htmlFor="chat-model" className="form__label">Chat Model Name</label>
                            <input
                                type="text"
                                id="chat-model"
                                name="chat_model_name"
                                value={formData.chat_model_name}
                                onChange={handleChange}
                                placeholder="llama-3"
                                className="form__input"
                            />
                        </div>

                        <div className="form__field">
                            <label htmlFor="embd-model" className="form__label">Embedding Model Name</label>
                            <input
                                type="text"
                                id="embd-model"
                                name="embd_model_name"
                                value={formData.embd_model_name}
                                onChange={handleChange}
                                placeholder="text-embedding-3"
                                className="form__input"
                            />
                        </div>
                    </fieldset>
                )}

                <button type="submit" className="btn btn--primary">Save Settings</button>
            </form>
            <button className="btn btn--danger-outline model-configuration__delete" onClick={handleDelete}>Delete credentials</button>
        </section>
    );
}

const makeLoadRequest = async ({ setDisplayMessage, setBackendStatus, portNumber }) => {
    try {
        const response = await fetch(`http://localhost:${portNumber}/load-models`);

        const responseData = await response.json();

        if (!response.ok) {
            setBackendStatus(ps => ({
                backend: false,
                models: false,
                vectorDB: false,
                agent: false
            }));

            console.error(responseData.CM);
            setDisplayMessage(responseData.UM);

            setTimeout(() => setDisplayMessage(""), 5000);

            return;
        }

        setBackendStatus(() => ({
            backend: true,
            models: true,
            vectorDB: true,
            agent: true
        }));

        console.log(responseData.CM);
        setDisplayMessage(responseData.UM);

        setTimeout(() => setDisplayMessage(""), 5000);

    } catch (error) {
        setBackendStatus(ps => ({
            backend: false,
            models: false,
            vectorDB: false,
            agent: false
        }));

        console.error(`Unable to load model! ${error}`);

        setDisplayMessage("Unable to load models.");

        setTimeout(() => setDisplayMessage(""), 5000);
    }
};