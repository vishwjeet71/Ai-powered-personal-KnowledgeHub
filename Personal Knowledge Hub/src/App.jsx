import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

// pages
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import DocumentUpdatePage from "./pages/DocumentUpdatePage";
import DocumentDetailsPage from "./pages/DocumentDetails";

//components
import Navigation from "./components/Navigation";
import BackendError from "./components/BackendError";
import GettingBackendReady from "./components/GettingBackendReady";

// Context
import ProjectContext from "./context/BackendComponentStatus";
import { useContext } from "react";

// Functions
import useDisplayMessage from "./Functions/DisplayMessages";

function App() {

  const [portNumber, setPortNumber] = useState("8000");
  const [cartStatus, setCartStatus] = useState(false);

  const [backendChild, setBackendChild] = useState(null);

  const [backendStatus, setBackendStatus] = useState({
    backend: "idle..",
    models: "idle..",
    vectorDB: "idle..",
    agent: "idle.."
  });

  const {
    currentMessage,
    setDisplayMessage
  } = useDisplayMessage(5000);


  useEffect(() => {
    let unlistenCloseRequest;

    async function setupExitListener() {
      try {
        const appWindow = getCurrentWindow();

        unlistenCloseRequest = await appWindow.onCloseRequested(async () => {
          console.log(`Closing application. Shutting down backend on port: ${portNumber}`);
          try {
            // Send the dynamic active port number to Rust to kill the right worker
            await invoke("send_backend_shutdown", { port: portNumber });
            console.log("Shutdown signal handled successfully.");
          } catch (err) {
            console.error("Failed to execute dynamic endpoint shutdown:", err);
          }
        });
      } catch (e) {
        console.error("Failed to bind window close listener:", e);
      }
    }

    setupExitListener();

    return () => {
      if (unlistenCloseRequest) {
        unlistenCloseRequest();
      }
    };
  }, [portNumber]);


  if (!cartStatus) {
    return (
      <GettingBackendReady
        portNumber={portNumber}
        setPortNumber={setPortNumber}
        setCartStatus={setCartStatus}
        setBackendChild={setBackendChild} />
    );
  }

  return (
    <>
      <ProjectContext.Provider value={
        { backendStatus, setBackendStatus, currentMessage, setDisplayMessage, portNumber }}>
        <BackendError />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/KnowledgeBase" element={<KnowledgeBase />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/documents/:id" element={<DocumentUpdatePage />} />
            <Route path="/getDocumentDetails/:id" element={<DocumentDetailsPage />} />
          </Routes>
          <Navigation />
        </BrowserRouter>
      </ProjectContext.Provider>
      {currentMessage && (
        <div className="message">
          {currentMessage}
        </div>
      )}
    </>
  );
}

export default App;

export const useProjectContext = () => {
  return useContext(ProjectContext);
}
