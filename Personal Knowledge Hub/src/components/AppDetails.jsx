import { useEffect, useState } from "react";
import {
    getName,
    getVersion,
    getIdentifier,
    getTauriVersion,
} from "@tauri-apps/api/app";

// plugins
import {
    platform,
    version as getOSVersion,
    arch,
} from "@tauri-apps/plugin-os";

import { openUrl } from "@tauri-apps/plugin-opener";

export default function AppDetails() {
    const appDis = "Your personal knowledge, organized and searchable. Knowledge Hub brings your documents into one place and uses AI-powered retrieval to help you quickly find the information you need. Import PDFs, DOCX, text files, and more, then ask questions and get answers grounded in your own documents. Your data stays local, keeping your knowledge private and under your control."
    const [appInfo, setAppInfo] = useState({
        appName: "Loading...",
        build: "Beta",
        appDis: appDis,
        appVersion: "Loading...",
        os: "Loading...",
        osVersion: "Loading...",
        architecture: "Loading...",
        appId: "Loading...",
        tauriVersion: "Loading...",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppInfo = async () => {
            try {
                const [
                    name,
                    appVersion,
                    identifier,
                    tauriVersion,
                ] = await Promise.all([
                    getName(),
                    getVersion(),
                    getIdentifier(),
                    getTauriVersion(),
                ]);

                setAppInfo({
                    appName: name,
                    build: "Beta",
                    appDis: appDis,
                    appVersion: appVersion,
                    os: platform(),
                    osVersion: getOSVersion(),
                    architecture: arch(),
                    appId: identifier,
                    tauriVersion: tauriVersion,
                });
            } catch (err) {
                console.error("Failed to fetch app information:", err);
                setError("Failed to load application information.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppInfo();
    }, []);

    const openDocumentation = async () => {
        try {
            await openUrl(
                "https://github.com/vishwjeet71/Ai-powered-personal-KnowledgeHub"
            );
        } catch (err) {
            console.error("Failed to open documentation:", err);
        }
    };

    if (loading) {
        return (
            <div>
                <h2>App Details</h2>
                <p>Loading application information...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h2>App Details</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h2>App Details</h2>
            <h2>{appInfo.appName}</h2>

            <p>{appInfo.appDis}</p>

            <hr />

            <h3>Application</h3>

            <p>
                <strong>Version:</strong> {appInfo.appVersion}
            </p>

            <p>
                <strong>Build:</strong> {appInfo.build}
            </p>

            <p>
                <strong>App ID:</strong> {appInfo.appId}
            </p>

            <p>
                <strong>Tauri:</strong> {appInfo.tauriVersion}
            </p>

            <hr />

            <h3>System</h3>

            <p>
                <strong>Operating System:</strong> {appInfo.os}
            </p>

            <p>
                <strong>OS Version:</strong> {appInfo.osVersion}
            </p>

            <p>
                <strong>Architecture:</strong> {appInfo.architecture}
            </p>

            <hr />

            <button onClick={openDocumentation}>
                Visit Documentation
            </button>
        </div>
    );
}