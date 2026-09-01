import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// pages
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import DocumentUpdatePage from "./pages/DocumentUpdatePage";

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


  if (!cartStatus) {
    return (
      <GettingBackendReady
        portNumber={portNumber}
        setPortNumber={setPortNumber}
        setCartStatus={setCartStatus} />
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