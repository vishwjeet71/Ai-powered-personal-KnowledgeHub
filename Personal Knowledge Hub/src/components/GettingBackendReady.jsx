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
//    number between 0 and 9999 and retry the backend connection
//    with a different port, up to 5 times.
//
// 3. If the backend fails for any reason other than the port being
//    unavailable, we immediately stop the process and do not retry
//    with another port.

// We don't return a promise here; we wait for the backend response.
// The operation either succeeds, returns "port in use" (retry), or fails (stop).

import { Command } from '@tauri-apps/plugin-shell';