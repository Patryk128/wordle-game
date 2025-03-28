import React, { useState } from "react";
import Game from "./Game.jsx";
import "./App.css"; // Nowy plik stylów dla App

function App() {
  const [mode, setMode] = useState("daily");
  const [key, setKey] = useState(0); // Resetuje komponent przy zmianie trybu

  const switchMode = (newMode) => {
    setMode(newMode);
    setKey((prevKey) => prevKey + 1); // Wymusza ponowne załadowanie Game
  };

  return (
    <div className="app-container">
      <h1>Wordle Game</h1>
      <div className="mode-switch">
        <button
          className={`mode-btn ${mode === "daily" ? "active-mode" : ""}`}
          onClick={() => switchMode("daily")}
        >
          Daily Mode
        </button>
        <button
          className={`mode-btn ${mode === "endless" ? "active-mode" : ""}`}
          onClick={() => switchMode("endless")}
        >
          Endless Mode
        </button>
      </div>
      <Game key={key} mode={mode} />
    </div>
  );
}

export default App;
