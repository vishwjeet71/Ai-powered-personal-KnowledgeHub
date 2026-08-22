import { useState } from "react";

export default function Settings() {
 
    const [formData, setFormData] = useState({
        api_provider: "openai", // Default checked value
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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Saved Configuration Data:", formData);

    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <h3>Model configuration</h3>
                <div>
                    <label>
                        <input
                            type="radio"
                            name="api_provider"
                            value="google"
                            checked={formData.api_provider === "google"}
                            onChange={handleChange}
                        />
                        <strong>Google</strong>
                        <p>Gemini chat + embeddings</p>
                    </label>
                </div>

                {/* OpenAI Radio */}
                <div>
                    <label>
                        <input
                            type="radio"
                            name="api_provider"
                            value="openai"
                            checked={formData.api_provider === "openai"}
                            onChange={handleChange}
                        />
                        <strong>OpenAI</strong>
                        <p>GPT chat + embeddings</p>
                    </label>
                </div>

                <div>
                    <label>
                        <input
                            type="radio"
                            name="api_provider"
                            value="openai-compatible"
                            checked={formData.api_provider === "openai-compatible"}
                            onChange={handleChange}
                        />
                        <strong>OpenAI-compatible</strong>
                        <p>Custom base URL, e.g. a local server</p>
                    </label>
                </div>
                <div>
                    <label htmlFor="api-key">API key</label>
                    <input
                        type="password"
                        id="api-key"
                        name="api_key"
                        value={formData.api_key}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                    />
                </div>
                {formData.api_provider === "openai-compatible" && (
                    <div>
                        <h4>Custom Provider Details</h4>

                        <div>
                            <label htmlFor="base-url">Base URL</label>
                            <input
                                type="text"
                                id="base-url"
                                name="base_url"
                                value={formData.base_url}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="chat-model">Chat Model Name</label>
                            <input
                                type="text"
                                id="chat-model"
                                name="chat_model_name"
                                value={formData.chat_model_name}
                                onChange={handleChange}
                                placeholder="llama-3"
                            />
                        </div>

                        <div>
                            <label htmlFor="embd-model">Embedding Model Name</label>
                            <input
                                type="text"
                                id="embd-model"
                                name="embd_model_name"
                                value={formData.embd_model_name}
                                onChange={handleChange}
                                placeholder="text-embedding-3"
                            />
                        </div>
                    </div>
                )}

                <button type="submit">Save Settings</button>
            </form>
        </>
    );
}
