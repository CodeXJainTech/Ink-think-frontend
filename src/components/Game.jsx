import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import DrawingBoard from "./DrawingBoard";

const Game = () => {
  const { roomId } = useParams();
  console.log("Game component mounted");

  // States
  const [guesses, setGuesses] = useState([]);
  const [message, setMessage] = useState("");
  const [word] = useState("Sunflower");
  const [isDrawer] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [drawerName] = useState("Player1");

  const chatRef = useRef(null);

  // Add guess handler (memoized to avoid re-creation each render)
  const handleGuess = useCallback(
    (e) => {
      e.preventDefault();
      if (!message.trim()) return;
      setGuesses((prev) => [...prev, { user: "You", text: message }]);
      setMessage("");
    },
    [message]
  );

  // Scroll chat to bottom only when new guess is added
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [guesses.length]);

  // Timer effect (runs only once, not on every tick)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1E1E2F] text-white flex flex-col p-2">
      {/* Top Info Bar */}
      <div className="flex justify-between items-center bg-[#2B2B40] px-3 py-2 rounded-md mb-2 border border-[#4D96FF]/40 shadow-sm">
        <h2 className="text-lg font-bold text-[#FF6F61]">🎮 Ink & Think</h2>
        <div className="hidden sm:flex gap-3 text-xs sm:text-sm text-gray-200">
          <span>Room: {roomId}</span>
          <span>Round: 1 / 5</span>
          <span>Players: 1 / 8</span>
        </div>
        <button
          className="sm:hidden px-2 py-1 bg-[#4ECDC4] rounded text-xs text-white"
          onClick={() => alert("Show side panel here")}
        >
          📊 Info
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 gap-2 flex-col sm:flex-row">
        {/* Ranking sidebar */}
        <div className="sm:flex-[3] flex flex-col bg-[#2B2B40] rounded-md border border-[#FFD93D]/30 shadow-sm p-2">
          <h3 className="text-sm font-semibold text-[#FFD93D] mb-1">🏆 Ranking</h3>
          <div className="flex flex-col gap-1 text-xs sm:text-sm">
            <span className="text-[#FF6F61] font-bold">1. Player1 (120 pts)</span>
            <span className="text-gray-300">2. Player2 (80 pts)</span>
            <span className="text-gray-300">3. Player3 (50 pts)</span>
          </div>
        </div>

        {/* Drawing board */}
        <div className="sm:flex-[17] flex flex-col bg-[#2B2B40] rounded-md border border-[#FFD93D]/30 shadow-sm">
          <div className="flex justify-between items-center px-2 py-1 border-b border-[#4D96FF]/30 text-xs sm:text-sm">
            <span className="text-[#FF6F61] font-semibold">✏️ Drawer: {drawerName}</span>
            {isDrawer ? (
              <span className="text-[#4ECDC4] font-bold">Word: {word}</span>
            ) : (
              <span className="italic text-gray-400">Guess the word...</span>
            )}
            <span className="text-[#4D96FF] font-bold">⏳ {timeLeft}s</span>
          </div>

          <div className="flex-1 flex justify-center items-center p-1 h-auto">
            <DrawingBoard director={true} />
          </div>
        </div>

        {/* Chat */}
        <div className="sm:flex-[4] flex flex-col bg-[#2B2B40] rounded-md p-2 border border-[#4D96FF]/40 shadow-sm h-[35vh] sm:h-auto">
          <h3 className="text-sm font-semibold text-[#FFD93D] mb-1">💬 Guesses</h3>
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto flex flex-col-reverse bg-[#1E1E2F] rounded-md p-1 border border-[#4ECDC4]/40 mb-1"
          >
            <div className="flex flex-col gap-1">
              {guesses.map((g, i) => (
                <p key={i} className="text-xs text-gray-200">
                  <span className="font-bold text-[#FF6F61]">{g.user}: </span>
                  {g.text}
                </p>
              ))}
            </div>
          </div>
          <form onSubmit={handleGuess} className="flex gap-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your guess..."
              className="flex-1 px-2 py-1 rounded bg-[#1E1E2F] border border-[#FFD93D]/40 text-white placeholder-gray-400 focus:outline-none text-xs"
            />
            <button
              type="submit"
              className="px-2 sm:px-3 bg-[#FF6F61] hover:bg-[#E65A50] rounded text-white font-bold text-xs"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Game;