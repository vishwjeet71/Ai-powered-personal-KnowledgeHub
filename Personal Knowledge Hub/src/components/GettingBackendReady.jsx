// This is the first component rendered in the entire application.
//
// It essentially acts as a command/trigger to start the FastAPI backend.
// The rest of the application is rendered only after a successful connection
// to the backend. If the backend connection fails, the application will not
// continue rendering and will be considered unavailable/crashed.

// Flow:
// 1. First, we try to launch the FastAPI backend on port 8000.
//    - If the backend starts successfully, we return the base URL
//      and render the remaining components.
//
// 2. If port 8000 is already in use, we randomly generate a port
//    number between 10000 and 60000 and User will be try to connect.

// We don't return a promise here; we wait for the backend response.
// The operation either succeeds or failed.

import { useEffect, useState, useRef } from "react";
import { Command } from "@tauri-apps/plugin-shell";

export default function GettingBackendReady({
  portNumber,
  setPortNumber,
  setCartStatus,
  setBackendChild
}) {
  const [error, setError] = useState(false);

  const startupRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function startBackend() {
      try {
        setError(false);

        if (!startupRef.current) {
          console.log(`Starting backend on port ${portNumber}...`);

          startupRef.current = (async () => {
            const command = Command.sidecar(
              "binaries/backend",
              [String(portNumber)]
            );

            const child = await command.spawn();

            console.log(
              "Backend process spawned:",
              child.pid
            );

            setBackendChild(child);

            await waitForBackend(
              `http://localhost:${portNumber}`
            );

            console.log("Backend is actually ready!");

            return child;
          })();
        }

        await startupRef.current;

        if (!cancelled) {
          setCartStatus(true);
        }

      } catch (err) {
        console.error("Failed to start backend:", err);

        startupRef.current = null;

        if (!cancelled) {
          setError(true);
        }
      }
    }

    startBackend();

    return () => {
      cancelled = true;
    };
  }, [portNumber, setCartStatus, setBackendChild]);

  // Backend failed
  if (error) {
    return (
      <div className="boot-screen boot-screen--error">
        <div className="boot-screen__panel">
          <span className="boot-screen__icon boot-screen__icon--error" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8.5" />
              <line x1="12" y1="8" x2="12" y2="13" />
              <circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </span>

          <h1 className="boot-screen__title">Backend failed to start</h1>

          <p className="boot-screen__message">
            Could not start backend on port <span className="mono">{portNumber}</span>
          </p>

          <button className="btn btn--primary" onClick={() => getRandomPortNumber(setPortNumber)}>
            <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v5h-5" />
            </svg>
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Backend is starting
  return (
    <div className="boot-screen">
      <div className="boot-screen__panel">
        <span className="boot-screen__spinner" aria-hidden="true"></span>
        <h1 className="boot-screen__title">Starting backend...</h1>
        <p className="boot-screen__message">Please wait...</p>
      </div>
    </div>
  );
}


function getRandomPortNumber(setPortNumber) {
  // Generate port between 10000 and 60000
  const portNumber =
    Math.floor(Math.random() * 50000) + 10000;

  console.log(`Trying new port: ${portNumber}`);

  setPortNumber(String(portNumber));
}


async function waitForBackend(url, timeout = 60000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${url}/get_backend_status`);

      if (response.ok) {
        return true;
      }
    } catch {
      // Backend isn't ready yet
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error("Backend did not become ready in time");
}
