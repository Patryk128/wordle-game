import React, { useState, useEffect, useRef } from "react";
import "./Game.css";

const baseURL = import.meta.env.VITE_ENGLISH_API_BASE_URL;
const wordLength = import.meta.env.VITE_ENGLISH_API_WORD_LENGTH;
const maxResults = import.meta.env.VITE_ENGLISH_API_MAX_RESULTS;

const pattern = "?".repeat(Number(wordLength));
const url = `${baseURL}?sp=${pattern}&max=${maxResults}`;

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
  const [timeLeft, setTimeLeft] = useState(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (mode === "daily") {
      fetchWord(true);
      calculateTimeUntilMidnight();
      const savedCompletion = localStorage.getItem("dailyCompleted");
      if (savedCompletion === "true") {
        setDailyCompleted(true);
      }
    } else {
      fetchWord();
    }
    resetGameState();
  }, [mode]);

  useEffect(() => {
    if (!isRevealing) {
      inputRef.current?.focus();
    }
  }, [isRevealing]);

  useEffect(() => {
    if (mode === "daily") {
      calculateTimeUntilMidnight();
      const interval = setInterval(calculateTimeUntilMidnight, 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const calculateTimeUntilMidnight = () => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    const diff = nextMidnight - now;
    setTimeLeft(new Date(diff).toISOString().substr(11, 8));
  };

  const sounds = {
    win: "/sounds/win.mp3",
    lose: "/sounds/lose.mp3",
  };

  const playSound = (type) => new Audio(sounds[type]).play();

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
      fetchWord();
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const fetchWord = async (isDaily = false) => {
    const today = new Date().toISOString().split("T")[0];

    if (isDaily) {
      const savedWordData = JSON.parse(localStorage.getItem("dailyWord"));
      if (savedWordData && savedWordData.date === today) {
        setTargetWord(savedWordData.word);
        return;
      }
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      const words = data
        .map((w) => w.word.toUpperCase())
        .filter((w) => w.length === 6);

      const word =
        words.length > 0
          ? words[Math.floor(Math.random() * words.length)]
          : "PUZZLE";

      if (isDaily) {
        localStorage.setItem(
          "dailyWord",
          JSON.stringify({ date: today, word })
        );
        localStorage.setItem("dailyCompleted", "false");
        setDailyCompleted(false);
      }

      setTargetWord(word);
    } catch (error) {
      console.error("Error fetching word:", error);
      setTargetWord("PUZZLE");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    const filteredValue = value.replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g, "");
    setGuess(filteredValue);
  };

  const getLetterColor = (letter, index) =>
    targetWord[index] === letter
      ? "green"
      : targetWord.includes(letter)
      ? "orange"
      : "gray";

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
      let newMessage = "";
      let sound = "";

      if (guess === targetWord) {
        newMessage = "🎉 Congratulations! You won!";
        sound = "win";
      } else if (currentRow === 5) {
        newMessage = `💀 You lost! The word was: ${targetWord}`;
        sound = "lose";
      } else {
        setCurrentRow(currentRow + 1);
      }

      setMessage(newMessage);
      setGameOver(newMessage !== "");
      playSound(sound);

      if (mode === "daily" && newMessage) {
        setDailyCompleted(true);
        localStorage.setItem("dailyCompleted", "true");
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
      {mode === "daily" && (gameOver || dailyCompleted) && (
        <div className="daily-info">
          <p className="daily-info-word">
            🔒 Daily word: <strong>{targetWord}</strong>
          </p>
          <p className="daily-info-timer">
            🕛 New word in: <strong>{timeLeft}</strong>
          </p>
        </div>
      )}

      {!(mode === "daily" && dailyCompleted) && (
        <>
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
                  const bgColor =
                    letterColors[`${rowIndex}-${i}`] || "transparent";
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
                className="guess-input"
                placeholder="Enter guess..."
              />
              <button
                onClick={handleSubmit}
                disabled={isRevealing || guess.length !== 6}
                className="submit-button"
              >
                Check
              </button>
            </div>
          )}
        </>
      )}

      {gameOver && (
        <div className="popup-overlay" onClick={resetGameState}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <p className="popup-message">{message}</p>
            <button className="play-again-button" onClick={resetGameState}>
              {mode === "daily" && dailyCompleted ? "OK" : "Play Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
