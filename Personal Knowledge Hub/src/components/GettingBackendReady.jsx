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
      <div>
        <h2>Backend failed to start</h2>

        <p>
          Could not start backend on port {portNumber}
        </p>

        <button onClick={() => getRandomPortNumber(setPortNumber)}>
          Retry
        </button>
      </div>
    );
  }

  // Backend is starting
  return (
    <div>
      <h2>Starting backend...</h2>
      <p>Please wait...</p>
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


async function waitForBackend(url, timeout = 20000) {
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

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error("Backend did not become ready in time");
}
