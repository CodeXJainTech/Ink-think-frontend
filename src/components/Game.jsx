import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import DrawingBoard from "./DrawingBoard";
import ViewBoard from "./ViewBoard";
import { io } from "socket.io-client";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:3000"; // backend REST base

const Game = () => {
  const { roomId } = useParams();
  const nickname = localStorage.getItem(`room:${roomId}:nickname`);
  const [socket, setSocket] = useState(null);

  // Chat / gameplay states
  const [guesses, setGuesses] = useState([]);
  const [message, setMessage] = useState("");

  // Role + word + timer
  const [word, setWord] = useState(""); // from server
  const [isDrawer, setIsDrawer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  // Room UI data
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [players, setPlayers] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [drawerName, setDrawerName] = useState("Unknown");

  const chatRef = useRef(null);

  // ---------------------------
  // Fetch room data for UI (REST)
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await axios.get(`/room/${roomId}`);
        if (cancelled) return;
        const r = data?.room || {};

        setRound(r.currentRound ?? 1);
        setTotalRounds(r.totalRounds ?? 5);
        setPlayers((r.players ?? []).map(p => ({ ...p, points: p.points ?? 0 })));
        setMaxPlayers(r.maxPlayers ?? 8);

        // initialize local timer from room config
        setTimeLeft(r.time ?? 60);
      } catch (e) {
        console.error("Failed to load room data:", e?.response?.data || e.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // ---------------------------
  // Local countdown timer: start immediately
  // (Server 'timer' events will still override/sync when received)
  // // ---------------------------
  // useEffect(() => {
  //   if (timerRef.current) clearInterval(timerRef.current);
  //   timerRef.current = setInterval(() => {
  //     setTimeLeft((t) => (t > 0 ? t - 1 : 0));
  //   }, 1000);
  //   return () => clearInterval(timerRef.current);
  // }, [roomId]); // restart when entering this game/room

  // ---------------------------
  // Setup socket + join room (keep your events)
  // ---------------------------
  useEffect(() => {
    const newSocket = io("http://localhost:3000"); // your backend URL
    setSocket(newSocket);

    newSocket.emit("joinRoom", { roomId, nickname });

    // role assignment
    newSocket.on("roundStart", ({ round, drawer, word }) => {
      setRound(round);
      setDrawerName(drawer);
      setIsDrawer(drawer === nickname);
      if (drawer === nickname) {
        setWord(word);   // only drawer sees the word
      } else {
        setWord("");     // guessers don’t
      }
    });

    console.log("432dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd4");
    // optional: server timer sync (if backend emits it)
    newSocket.on("timerUpdate", (payload) => {
      console.log("client received timerUpdate:", payload);
      setTimeLeft(payload.timeLeft);
    });


    // guesses
    newSocket.on("newGuess", (guess) => {
      setGuesses((prev) => [...prev, guess]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  // ---------------------------
  // Guess handler
  // ---------------------------
  const handleGuess = useCallback(
    (e) => {
      e.preventDefault();
      if (!message.trim() || !socket) return;
      const guess = { user: "You", text: message };
      setGuesses((prev) => [...prev, guess]);
      socket.emit("sendGuess", { roomId, guess });
      setMessage("");
    },
    [message, socket, roomId]
  );

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [guesses.length]);

  return (
    <div className="min-h-screen bg-[#1E1E2F] text-white flex flex-col p-2">
      {/* Top Info Bar */}
      <div className="flex justify-between items-center bg-[#2B2B40] px-3 py-2 rounded-md mb-2 border border-[#4D96FF]/40 shadow-sm">
        <h2 className="text-lg font-bold text-[#FF6F61]">🎮 Ink & Think</h2>
        <div className="hidden sm:flex gap-3 text-xs sm:text-sm text-gray-200">
          <span>Room: {roomId}</span>
          <span>Round: {round} / {totalRounds}</span>
          <span>Players: {players.length} / {maxPlayers}</span>
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
            {players.length === 0 ? (
              <>
                <span className="text-gray-300">No players yet</span>
              </>
            ) : (
              players.map((p, i) => (
                <span
                  key={`${p.nickname}-${i}`}
                  className={`${i === 0 ? "text-[#FF6F61] font-bold" : "text-gray-300"}`}
                >
                  {i + 1}. {p.nickname} ({p.points ?? 0} pts)
                </span>
              ))
            )}
          </div>
        </div>

        {/* Drawing board area */}
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
            {/* Keep your existing logic */}
            {isDrawer ? (
              <DrawingBoard socket={socket} roomId={roomId} />
            ) : (
              <ViewBoard roomId={roomId} socket={socket} />
            )}
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