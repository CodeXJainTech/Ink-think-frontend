import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:3000";

const Home = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleRoomJoin = async () => {
    if (!nickname.trim()) {
      alert("Enter your nickname.");
      return;
    }
    if (!roomId.trim()) {
      alert("Enter Room ID.");
      return;
    }

    try {
      await axios.post("/adduser", { nickname: nickname.trim(), roomId: roomId.trim() });
      // Persist nickname per-room so refreshes keep identity
      localStorage.setItem(`room:${roomId.trim()}:nickname`, nickname.trim());
      navigate(`/room/${roomId.trim()}`, { state: { nickname: nickname.trim() } });
    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong. Try again.";
      alert(msg);
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#1e293b]">
      <div className="bg-[#334155] p-8 rounded-2xl shadow-2xl w-[400px] text-center border-4 border-dashed border-[#06b6d4]">
        <h1 className="text-4xl font-extrabold text-[#facc15] mb-2 drop-shadow">
          🎨 Ink & Think
        </h1>
        <h2 className="text-lg text-[#38bdf8] font-semibold mb-6">
          Guess, Draw & Have Fun!
        </h2>

        <label className="block text-gray-200 text-sm mb-1 text-left">Nickname</label>
        <input
          type="text"
          placeholder="Enter nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full mb-4 p-2 rounded-lg border-2 border-[#f97316] focus:outline-none focus:ring-2 focus:ring-[#84cc16] bg-[#1e293b] text-white placeholder-gray-400"
        />

        <label className="block text-gray-200 text-sm mb-1 text-left">Room ID</label>
        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          className="w-full mb-6 p-2 rounded-lg border-2 border-[#06b6d4] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] bg-[#1e293b] text-white placeholder-gray-400"
        />

        <div className="flex gap-4 justify-center">
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ec4899] to-[#f97316] text-white font-bold shadow-md hover:scale-105 transition"
            onClick={() => navigate("/setup", { state: { nickname: nickname.trim() || "" } })}
          >
            Create Room
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#84cc16] text-white font-bold shadow-md hover:scale-105 transition"
            onClick={handleRoomJoin}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;