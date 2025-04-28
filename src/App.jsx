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
      {/* Dodana klasa dla tytułu */}
      <h1 className="app-title">Wordle Game</h1>

      {/* Kontener dla przycisków trybu */}
      <div className="mode-switch">
        <button
          // Klasy są już poprawne
          className={`mode-btn ${mode === "daily" ? "active-mode" : ""}`}
          onClick={() => switchMode("daily")}
        >
          Daily Mode
        </button>
        <button
          // Klasy są już poprawne
          className={`mode-btn ${mode === "endless" ? "active-mode" : ""}`}
          onClick={() => switchMode("endless")}
        >
          Endless Mode
        </button>
      </div>

      {/* Komponent Game, przekazujemy klucz i tryb */}
      <Game key={key} mode={mode} />
    </div>
  );
}

export default App;
