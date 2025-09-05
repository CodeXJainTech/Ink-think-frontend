// src/components/Game.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import DrawingBoard from "./DrawingBoard";
import ViewBoard from "./ViewBoard";

axios.defaults.baseURL = "https://ink-think.onrender.com";

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const nickname = localStorage.getItem(`room:${roomId}:nickname`);
  const [connected, setConnected] = useState(false);

  // chat/game state
  const [guesses, setGuesses] = useState([]);
  const [message, setMessage] = useState("");
  const [canChat, setCanChat] = useState(true);
  const [roundMessage, setRoundMessage] = useState(null);
  const [turnMessage, setTurnMessage] = useState(null);

  // game
  const [word, setWord] = useState("");
  const [isDrawer, setIsDrawer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [players, setPlayers] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [drawerName, setDrawerName] = useState("Unknown");

  // game over
  const [gameOver, setGameOver] = useState(false);
  const [finalRanking, setFinalRanking] = useState([]);

  const chatRef = useRef(null);
  useEffect(() => {
    // 👇 run only once when component mounts
    if (!sessionStorage.getItem("game-page-refreshed")) {
      sessionStorage.setItem("game-page-refreshed", "true");
      window.location.reload(); // refresh page once
    }
  }, []);


  // fetch room UI data once
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/room/${roomId}`);
        const r = data?.room || {};
        setRound(r.currentRound ?? 1);
        setTotalRounds(r.totalRounds ?? 5);
        setPlayers((r.players ?? []).map(p => ({ ...p })));
        setMaxPlayers(r.maxPlayers ?? 8);
        setTimeLeft(r.time ?? 60);
      } catch (e) {
        console.error("Failed to load room data:", e?.response?.data || e.message);
      }
    })();
  }, [roomId]);

  // socket lifecycle
  useEffect(() => {
    if (!nickname) {
      console.warn("Game.jsx: missing nickname for room", roomId);
      return;
    }

    if (!socket.connected) socket.connect();
    setConnected(true);

    const handleConnect = () => {
      socket.emit("joinRoom", { roomId, nickname });
    };

    // events
    // inside Game component

    // events
    const handleTurnStart = ({ drawer }) => {
      setDrawerName(drawer);

      const imDrawer = drawer === nickname;
      setIsDrawer(imDrawer);
      setWord(""); 
      setCanChat(!imDrawer);
      setTurnMessage(`✏️ ${drawer} is drawing...`);
      setTimeout(() => setTurnMessage(null), 2000);
    };
    
    const handleRoundStart = ({ round }) => {
      setRound(round);
      setRoundMessage(`🎉 Round ${round} started!`);
      setTimeout(() => setRoundMessage(null), 3000);
    }
    const handleWord = ({ word }) => {
      setWord(word || "");
    };

    const handleTimer = ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    };

    const handleNewGuess = (guess) => {
      setGuesses(prev => [...prev, guess]);
    };

    const handleCorrectGuess = ({ user }) => {
      setGuesses(prev => [
        ...prev,
        { user: "System", text: `${user} guessed the word! 🎉` }
      ]);
      if (user === nickname) setCanChat(false);
    };

    const handleRoomUpdated = (room) => {
      setPlayers((room.players || []).map(p => ({ ...p })));
    };

    const handleChatDisabled = () => setCanChat(false);
    const handleChatEnabled = () => setCanChat(true);

    const handleGameOver = ({ ranking }) => {
      setGameOver(true);
      setFinalRanking(ranking || []);
      // after 8s, route back to lobby
      setTimeout(() => {
        navigate(`/room/${roomId}`);
      }, 8000);
    };

    // bind
    socket.on("connect", handleConnect);
    socket.on("roundStart", handleRoundStart);
    socket.on("turnStart", handleTurnStart);
    socket.on("word", handleWord);
    socket.on("timerUpdate", handleTimer);
    socket.on("newGuess", handleNewGuess);
    socket.on("correctGuess", handleCorrectGuess);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("chatDisabled", handleChatDisabled);
    socket.on("chatEnabled", handleChatEnabled);
    socket.on("gameOver", handleGameOver);

    socket.emit("fetchDrawing", { roomId });
    socket.emit("roomUpdated", { roomId });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("roundStart", handleRoundStart);
      socket.off("turnStart", handleTurnStart);
      socket.off("word", handleWord);
      socket.off("timerUpdate", handleTimer);
      socket.off("newGuess", handleNewGuess);
      socket.off("correctGuess", handleCorrectGuess);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("chatDisabled", handleChatDisabled);
      socket.off("chatEnabled", handleChatEnabled);
      socket.off("gameOver", handleGameOver);
      try {
        socket.emit("leaveRoom", { roomId, nickname });
      } catch (e) {}
    };
  }, [roomId, nickname, navigate]);

  const handleGuess = useCallback((e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !canChat) return;
    socket.emit("sendGuess", { roomId, nickname, text: message });
    setMessage("");
  }, [message, roomId, nickname, canChat]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [guesses.length]);

  return (
    <div className="relative min-h-screen bg-[#1E1E2F] text-white flex flex-col p-2">
      {/* top info */}
      <div className="flex justify-between items-center bg-[#2B2B40] px-3 py-2 rounded-md mb-2 border border-[#4D96FF]/40 shadow-sm">
        <h2 className="text-lg font-bold text-[#FF6F61]">🎮 Ink & Think</h2>
        <div className="hidden sm:flex gap-3 text-xs sm:text-sm text-gray-200">
          <span>Room: {roomId}</span>
          <span>Round: {round} / {totalRounds}</span>
          <span>Players: {players.length} / {maxPlayers}</span>
        </div>
      </div>

      {/* main */}
      <div className="flex flex-1 gap-2 flex-col sm:flex-row">
        <div className="sm:flex-[3] flex flex-col bg-[#2B2B40] rounded-md border p-2">
          <h3 className="text-sm font-semibold text-[#FFD93D] mb-1">🏆 Ranking</h3>
          <div className="flex flex-col gap-1 text-xs sm:text-sm">
            {players.length === 0 ? <span className="text-gray-300">No players yet</span> :
              players.map((p, i) => (
                <span key={`${p.nickname}-${i}`} className={`${i===0 ? "text-[#FF6F61] font-bold" : "text-gray-300"}`}>
                  {i+1}. {p.nickname} ({p.score ?? 0} pts)
                </span>
              ))
            }
          </div>
        </div>

        <div className="sm:flex-[17] flex flex-col bg-[#2B2B40] rounded-md border p-1">
          <div className="flex justify-between items-center px-2 py-1 border-b text-xs sm:text-sm">
            <span className="text-[#FF6F61] font-semibold">✏️ Drawer: {drawerName}</span>
            {isDrawer ? <span className="text-[#4ECDC4] font-bold">Word: {word}</span> : <span className="italic text-gray-400">Guess the word...</span>}
            <span className="text-[#4D96FF] font-bold">⏳ {timeLeft}s</span>
          </div>
          <div className="flex-1 flex justify-center items-center p-1 h-auto">
            {isDrawer ? <DrawingBoard socket={socket} roomId={roomId} /> : <ViewBoard socket={socket} roomId={roomId} />}
          </div>
        </div>

        <div className="sm:flex-[4] flex flex-col bg-[#2B2B40] rounded-md p-2 border h-[35vh] sm:h-auto">
          <h3 className="text-sm font-semibold text-[#FFD93D] mb-1">💬 Guesses</h3>
          <div ref={chatRef} className="flex-1 overflow-y-auto bg-[#1E1E2F] rounded-md p-1 border mb-1">
            <div className="flex flex-col gap-1">
              {guesses.map((g, i) => (
                <p key={i} className={`text-xs ${g.user === "System" ? "text-green-400 italic" : "text-gray-200"}`}>
                  {g.user !== "System" ? <><span className="font-bold text-[#FF6F61]">{g.user}: </span>{g.text}</> : g.text}
                </p>
              ))}
            </div>
          </div>
          <form onSubmit={handleGuess} className="flex gap-1">
            <input type="text" value={message} disabled={!canChat} onChange={(e)=>setMessage(e.target.value)}
              placeholder={canChat ? "Type your guess..." : "Chat disabled"} className="flex-1 px-2 py-1 rounded bg-[#1E1E2F] border text-white placeholder-gray-400 focus:outline-none text-xs" />
            <button type="submit" disabled={!canChat} className="px-2 sm:px-3 bg-[#FF6F61] hover:bg-[#E65A50] rounded text-white font-bold text-xs">Send</button>
          </form>
        </div>
      </div>

      {/* game over overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <h1 className="text-3xl font-bold mb-4 text-white">🏆 Game Over!</h1>
          <div className="bg-[#2B2B40] p-4 rounded shadow-md min-w-[250px]">
            {finalRanking.map((p, i) => (
              <div key={p.nickname} className={`py-1 ${i===0 ? "text-yellow-400 font-bold" : i===1 ? "text-gray-300 font-bold" : i===2 ? "text-orange-400 font-bold" : "text-white"}`}>
                {i+1}. {p.nickname} — {p.score} pts
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-300">Returning to room...</p>
        </div>
      )}

      {roundMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 animate-pulse">
              {roundMessage}
            </h2>
            <p className="text-gray-300">Get ready…</p>
          </div>
        </div>
      )}

      {turnMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 animate-pulse">
              {turnMessage}
            </h2>
          </div>
        </div>
      )}

    </div>
  );
};

export default Game;