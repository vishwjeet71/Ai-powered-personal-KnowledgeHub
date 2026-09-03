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
            <section className="panel app-details">
                <h2 className="panel__title">App Details</h2>
                <p className="loading-state__text">Loading application information...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="panel app-details">
                <h2 className="panel__title">App Details</h2>
                <p className="error-text">{error}</p>
            </section>
        );
    }

    return (
        <section className="panel app-details">
            <h2 className="panel__title">App Details</h2>

            <div className="app-details__profile">
                <span className="app-details__avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
                        <path d="M6 3.5h9l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6.5 3.5Z" />
                        <path d="M14.5 3.5V8H19" />
                    </svg>
                </span>
                <div className="app-details__identity">
                    <h3 className="app-details__name">{appInfo.appName}</h3>
                    <span className="badge">{appInfo.build}</span>
                </div>
            </div>

            <p className="app-details__description">{appInfo.appDis}</p>

            <hr className="divider" />

            <h3 className="app-details__section-title">Application</h3>

            <dl className="detail-list">
                <div className="detail-list__row">
                    <dt>Version:</dt>
                    <dd className="mono">{appInfo.appVersion}</dd>
                </div>

                <div className="detail-list__row">
                    <dt>Build:</dt>
                    <dd>{appInfo.build}</dd>
                </div>

                <div className="detail-list__row">
                    <dt>App ID:</dt>
                    <dd className="mono">{appInfo.appId}</dd>
                </div>

                <div className="detail-list__row">
                    <dt>Tauri:</dt>
                    <dd className="mono">{appInfo.tauriVersion}</dd>
                </div>
            </dl>

            <hr className="divider" />

            <h3 className="app-details__section-title">System</h3>

            <dl className="detail-list">
                <div className="detail-list__row">
                    <dt>Operating System:</dt>
                    <dd>{appInfo.os}</dd>
                </div>

                <div className="detail-list__row">
                    <dt>OS Version:</dt>
                    <dd className="mono">{appInfo.osVersion}</dd>
                </div>

                <div className="detail-list__row">
                    <dt>Architecture:</dt>
                    <dd className="mono">{appInfo.architecture}</dd>
                </div>
            </dl>

            <button className="btn btn--outline" onClick={openDocumentation}>
                <span>Visit Documentation</span>
                <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.5-1.5V15" />
                    <path d="M13 5h6v6" />
                    <path d="M20 4 11 13" />
                </svg>
            </button>
        </section>
    );
}