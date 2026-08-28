import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// pages
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";

//components
import Navigation from "./components/Navigation";
import BackendError from "./components/BackendError";

// Context
import ProjectContext from "./context/BackendComponentStatus";
import { useContext } from "react";

// Functions
import useDisplayMessage from "./Functions/DisplayMessages";

function App() {

  const [backendStatus, setBackendStatus] = useState({
    backend: "idle..",
    models: "idle..",
    vectorDB: "idle..",
  });

  const {
    currentMessage,
    setDisplayMessage
  } = useDisplayMessage(5000);

  return (
    <>
      <ProjectContext.Provider value={
        { backendStatus, setBackendStatus, currentMessage, setDisplayMessage }}>
        <BackendError />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/KnowledgeBase" element={<KnowledgeBase />} />
            <Route path="/settings" element={<Settings />} />
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