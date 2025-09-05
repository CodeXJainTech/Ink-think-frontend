// src/components/Room.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import socket from "../socket";

axios.defaults.baseURL = "https://ink-think.onrender.com";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const didJoin = useRef(false);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [myName, setMyName] = useState(() => {
    return (
      location.state?.nickname ||
      localStorage.getItem(`room:${roomId}:nickname`) ||
      null
    );
  });

  const iAmOwner = useMemo(
    () => room && myName && room.owner === myName,
    [room, myName]
  );

  // fetch room data
  const fetchRoom = async () => {
    const { data } = await axios.get(`/room/${roomId}`);
    return data.room;
  };

  // join logic
  const ensureJoined = async () => {
    try {
      const r = await fetchRoom();
      if (!myName) {
        const { data } = await axios.post(`/room/${roomId}/autojoin`);
        setMyName(data.nickname);
        localStorage.setItem(`room:${roomId}:nickname`, data.nickname);
        setRoom(data.room);
      } else {
        setRoom(r);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Room not found.";
      alert(msg);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // initial fetch once
  useEffect(() => {
    if (didJoin.current) return;
    didJoin.current = true;
    ensureJoined();
  }, [roomId]);

  // socket setup (runs when myName is ready)
  useEffect(() => {
    if (!myName) return; // wait until nickname is ready

    if (!socket.connected) socket.connect();
    socket.emit("joinRoom", { roomId, nickname: myName });

    socket.on("userJoined", (player) => {
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.players.some((p) => p.nickname === player.nickname)) return prev;
        return { ...prev, players: [...prev.players, player] };
      });
    });

    socket.on("userLeft", (nickname) => {
      setRoom((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.nickname !== nickname),
      }));
    });

    socket.on("gameStarted", ({ roomId }) => {
      console.log("📢 gameStarted received, navigating...");
      setIsStarted(true);
    });

    return () => {
      socket.emit("leaveRoom", { roomId, nickname: myName });
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("gameStarted");
    };
  }, [roomId, myName]);

  // navigate when game starts
  useEffect(() => {
    if (isStarted) {
      navigate(`/game/${roomId}`);
    }
  }, [isStarted, navigate, roomId]);

  // owner starts the game
  const handleStart = () => {
    socket.emit("startGame", { roomId, nickname: myName });
  };

  const handleEdit = () => {
    navigate("/setup", { state: { room: { ...room, roomId } } });
  };

  const handleLeave = async () => {
    try {
      await axios.post(`/room/${roomId}/leave`, { nickname: myName });
      socket.emit("leaveRoom", { roomId, nickname: myName });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(`room:${roomId}:nickname`);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111827] text-white">
        Loading room…
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#111827] text-white">
      <div className="bg-[#1f2937] p-6 rounded-2xl shadow-xl w-[520px] border-4 border-dashed border-[#06b6d4]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-[#f97316] drop-shadow">
            🎉 {room.owner}'s Room
          </h1>
          <span className="text-xs px-2 py-1 rounded bg-[#0ea5e9]/20 text-[#7dd3fc]">
            You: {myName}
          </span>
        </div>
        <p className="text-[#38bdf8] mb-4">Room ID: {roomId}</p>

        <div className="bg-[#0f172a] p-3 rounded-lg text-sm mb-4">
          <p>⏱ Time: {room.time}s</p>
          <p>👥 Max Players: {room.maxPlayers}</p>
          <p>🔄 Rounds: {room.totalRounds}</p>
          <p>🧩 Word Type: {room.wordType}</p>
        </div>

        <h2 className="text-lg font-semibold mb-2">Players</h2>
        <ul className="bg-[#0f172a] p-3 rounded-lg mb-4 max-h-48 overflow-y-auto">
          {room.players.map((p, idx) => (
            <li
              key={`${p.nickname}-${idx}`}
              className={`mb-2 p-2 rounded ${
                p.nickname === room.owner
                  ? "bg-[#f97316] text-black font-bold"
                  : "bg-[#374151] text-white"
              }`}
            >
              {p.nickname} {p.nickname === room.owner && "(Owner)"}
            </li>
          ))}
        </ul>

        <div className="flex gap-3 justify-center">
          {iAmOwner && (
            <>
              <button
                onClick={handleStart}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#84cc16] to-[#06b6d4] text-white font-bold shadow-md hover:scale-105 transition"
              >
                🚀 Start Game
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white font-bold shadow-md hover:scale-105 transition"
              >
                ✏️ Edit
              </button>
            </>
          )}
          <button
            onClick={handleLeave}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ec4899] to-[#f97316] text-white font-bold shadow-md hover:scale-105 transition"
          >
            🔙 Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;