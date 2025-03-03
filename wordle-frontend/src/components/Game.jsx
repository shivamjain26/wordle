// src/components/Game.jsx - Game Component
import { useState } from "react";

const Game = () => {
  const [gameId, setGameId] = useState(null);
  const [word, setWord] = useState("");
  const [guess, setGuess] = useState("");
  const [messages, setMessages] = useState([]);
  let socket;

  const createGame = async () => {
    const response = await fetch("https://wordle-nwil.onrender.com/create_game/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });
    const data = await response.json();
    setGameId(data.game_id);
    connectWebSocket(data.game_id);
  };

  const connectWebSocket = (gameId) => {
    socket = new WebSocket(`wss://wordle-nwil.onrender.com/ws/${gameId}`);
    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, JSON.parse(event.data)]);
    };
  };

  const sendGuess = () => {
    if (socket && guess) {
      socket.send(JSON.stringify({ guess }));
      setGuess("");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      {!gameId ? (
        <div>
          <input
            type="text"
            placeholder="Enter a word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={createGame}
            className="mt-2 p-2 bg-blue-500 text-white rounded"
          >
            Create Game
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Enter guess"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={sendGuess}
            className="mt-2 p-2 bg-green-500 text-white rounded"
          >
            Submit Guess
          </button>
          <div className="mt-4 text-left">
            {messages.map((msg, index) => (
              <p key={index}>{msg.guess}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
