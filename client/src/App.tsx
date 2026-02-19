import { useState } from "react";

import ChildReaderPortal from "./pages/ChildReaderPortal";
import ParentPortal from "./pages/ParentPortal";

import "./styles/app/ModeSwitch.css";

type ViewMode = "reader" | "parent";

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("parent");

  return (
    <div>
      <div className="mode-switch-shell">
        <nav className="mode-switch">
          <button
            type="button"
            className={viewMode === "reader" ? "mode-button active" : "mode-button"}
            onClick={() => setViewMode("reader")}
          >
            Child Reader
          </button>
          <button
            type="button"
            className={viewMode === "parent" ? "mode-button active" : "mode-button"}
            onClick={() => setViewMode("parent")}
          >
            Parent Hub
          </button>
        </nav>
      </div>

      {viewMode === "reader" && <ChildReaderPortal />}
      {viewMode === "parent" && <ParentPortal />}
    </div>
  );
}

export default App;
