import React, { useState, useEffect, useRef } from "react";
import "./Game.css";

const ENGLISH_API = "https://api.datamuse.com/words?sp=??????&max=100";

const Game = ({ mode }) => {
  const [targetWord, setTargetWord] = useState("");
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [revealedLetters, setRevealedLetters] = useState([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [letterColors, setLetterColors] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (mode === "daily") {
      fetchDailyWord();
    } else {
      fetchNewWord();
    }
    resetGameState();
  }, [mode]);

  useEffect(() => {
    if (!isRevealing) {
      inputRef.current?.focus();
    }
  }, [isRevealing]);

  const resetGameState = () => {
    setAttempts([]);
    setCurrentRow(0);
    setGameOver(false);
    setMessage("");
    setRevealedLetters([]);
    setIsRevealing(false);
    setLetterColors({});
    setGuess("");

    if (mode === "endless") {
      fetchNewWord(); // Pobierz nowe słowo tylko w trybie endless
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const fetchDailyWord = async () => {
    const today = new Date().toISOString().split("T")[0];
    const savedWordData = JSON.parse(localStorage.getItem("dailyWord"));

    if (savedWordData && savedWordData.date === today) {
      setTargetWord(savedWordData.word);
      return;
    }

    try {
      const response = await fetch(ENGLISH_API);
      const data = await response.json();
      const words = data
        .map((w) => w.word.toUpperCase())
        .filter((w) => w.length === 6);
      const word =
        words.length > 0
          ? words[Math.floor(Math.random() * words.length)]
          : "PUZZLE";

      localStorage.setItem("dailyWord", JSON.stringify({ date: today, word }));
      setTargetWord(word);
    } catch (error) {
      console.error("Error fetching word:", error);
      setTargetWord("PUZZLE");
    }
  };

  const fetchNewWord = async () => {
    try {
      const response = await fetch(ENGLISH_API);
      const data = await response.json();
      const words = data
        .map((w) => w.word.toUpperCase())
        .filter((w) => w.length === 6);
      const word =
        words.length > 0
          ? words[Math.floor(Math.random() * words.length)]
          : "PUZZLE";
      setTargetWord(word);
    } catch (error) {
      console.error("Error fetching word:", error);
      setTargetWord("PUZZLE");
    }
  };

  const playSound = (src) => {
    const audio = new Audio(src);
    audio.play();
  };

  const handleInputChange = (e) => {
    if (isRevealing) return;
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    setGuess(value);
  };

  const getLetterColor = (letter, index) => {
    if (targetWord[index] === letter) return "green";
    if (targetWord.includes(letter)) return "orange";
    return "gray";
  };

  const revealLetters = (word, rowIndex) => {
    setIsRevealing(true);
    setRevealedLetters([]);

    let newLetterColors = { ...letterColors };

    word.split("").forEach((letter, i) => {
      setTimeout(() => {
        const color = getLetterColor(letter, i);
        newLetterColors[`${rowIndex}-${i}`] = color;

        setLetterColors({ ...newLetterColors });
        setRevealedLetters((prev) => [...prev, { letter, rowIndex, index: i }]);

        if (i === word.length - 1) {
          setTimeout(() => setIsRevealing(false), 500);
        }
      }, i * 500);
    });
  };

  const handleSubmit = () => {
    if (guess.length !== 6 || gameOver || currentRow >= 6 || isRevealing)
      return;

    setAttempts([...attempts, guess]);
    setGuess("");

    revealLetters(guess, currentRow);

    setTimeout(() => {
      if (guess === targetWord) {
        setMessage("🎉 Congratulations! You won!");
        setGameOver(true);
        playSound("/sounds/win.mp3");
      } else if (currentRow === 5) {
        setMessage(`💀 You lost! The word was: ${targetWord}`);
        setGameOver(true);
        playSound("/sounds/lose.mp3");
      } else {
        setCurrentRow(currentRow + 1);
        playSound("/sounds/error.mp3");
      }
    }, 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className={`game-container ${mode}`}>
      <div className="attempts">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div key={rowIndex} className="word">
            {Array.from({ length: 6 }).map((_, i) => {
              const letterData = revealedLetters.find(
                (l) => l.rowIndex === rowIndex && l.index === i
              );
              const letter = letterData
                ? letterData.letter
                : attempts[rowIndex]?.[i] || "";
              const bgColor = letterColors[`${rowIndex}-${i}`] || "transparent";
              const flipClass = letterData ? "flip" : "";

              return (
                <span
                  key={i}
                  className={`letter-box ${flipClass}`}
                  style={{ backgroundColor: bgColor }}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {!gameOver && (
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={6}
            disabled={isRevealing}
          />
          <button onClick={handleSubmit} disabled={isRevealing}>
            Check
          </button>
        </div>
      )}

      {gameOver && (
        <div className="popup">
          <p>{message}</p>
          <button onClick={() => resetGameState()}>Play again</button>
        </div>
      )}
    </div>
  );
};

export default Game;
