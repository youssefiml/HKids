import { useState } from "react";

import BackofficeShell from "./pages/BackofficeShell";
import ParentPortal from "./pages/ParentPortal";
import PublicReader from "./pages/PublicReader";

import "./styles/app/ModeSwitch.css";

type ViewMode = "reader" | "backoffice" | "parent";

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("reader");

  return (
    <div>
      <nav className="mode-switch">
        <button
          type="button"
          className={viewMode === "reader" ? "mode-button active" : "mode-button"}
          onClick={() => setViewMode("reader")}
        >
          Public Reader
        </button>
        <button
          type="button"
          className={viewMode === "backoffice" ? "mode-button active" : "mode-button"}
          onClick={() => setViewMode("backoffice")}
        >
          Backoffice
        </button>
        <button
          type="button"
          className={viewMode === "parent" ? "mode-button active" : "mode-button"}
          onClick={() => setViewMode("parent")}
        >
          Parent Hub
        </button>
      </nav>

      {viewMode === "reader" && <PublicReader />}
      {viewMode === "parent" && <ParentPortal />}
      {viewMode === "backoffice" && <BackofficeShell />}
    </div>
  );
}

export default App;