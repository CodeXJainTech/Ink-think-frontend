import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:3000";
const WORD_TYPES = ["Animals", "Places", "Buildings", "Food", "Random"];

const Setup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editRoom = location.state?.room || null; // when editing
  const presetNickname = location.state?.nickname || editRoom?.owner || "";

  const [form, setForm] = useState({
    owner: presetNickname || "",
    maxPlayers: editRoom?.maxPlayers || 6,
    wordType: editRoom?.wordType || "any",
    time: editRoom?.time || 60,
    totalRounds: editRoom?.totalRounds || 5,
  });

  const isEdit = Boolean(editRoom?.roomId);

  // useEffect(() => {
  //   if (!isEdit && !presetNickname) {
  //     // user came to setup without a name; not fatal, but warn
  //     // could also redirect to home
  //   }
  // }, [isEdit, presetNickname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "owner" ? value : Number(value) || value }));
  };

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        const { roomId } = editRoom;
        const { data } = await axios.put(`/room/${roomId}`, {
          maxPlayers: form.maxPlayers,
          wordType: form.wordType,
          time: form.time,
          totalRounds: form.totalRounds,
        });
        navigate(`/room/${roomId}`, { state: { nickname: data.room.owner } });
      } else {
        // create
        const { data } = await axios.post("/createroom", {
          owner: form.owner.trim(),
          maxPlayers: form.maxPlayers,
          wordType: form.wordType,
          time: form.time,
          totalRounds: form.totalRounds,
        });
        // persist owner nickname for that room
        localStorage.setItem(`room:${data.roomId}:nickname`, form.owner.trim());
        navigate(`/room/${data.roomId}`, { state: { nickname: form.owner.trim() } });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save room settings.";
      alert(msg);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#111827] text-white">
      <div className="bg-[#1f2937] p-6 rounded-2xl shadow-xl w-[480px] border-4 border-dashed border-[#06b6d4]">
        <h1 className="text-2xl font-bold text-[#f97316] mb-4">
          {isEdit ? "✏️ Edit Room" : "✨ Create Room"}
        </h1>

        {!isEdit && (
          <>
            <label className="block text-sm mb-1">Owner (Room name)</label>
            <input
              name="owner"
              value={form.owner}
              onChange={handleChange}
              placeholder="Your nickname"
              className="w-full mb-3 p-2 rounded bg-[#0f172a] border border-[#38bdf8] text-white"
            />
          </>
        )}

        <label className="block text-sm mb-1">Max Players</label>
        <input
          name="maxPlayers"
          type="number"
          min="2"
          max="12"
          value={form.maxPlayers}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-[#0f172a] border border-[#38bdf8] text-white"
        />

        <label className="block text-gray-200 text-sm mb-1 text-left">
          Word Type
        </label>
        <select
          name="wordType"
          value={form.wordType}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-[#0f172a] border border-[#38bdf8] text-white"
        >
          {WORD_TYPES.map((type) => (
            <option key={type} value={type.toLowerCase()}>
              {type}
            </option>
          ))}
        </select>

        <label className="block text-sm mb-1">Time per Round (s)</label>
        <input
          name="time"
          type="number"
          min="20"
          max="180"
          value={form.time}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-[#0f172a] border border-[#38bdf8] text-white"
        />

        <label className="block text-sm mb-1">Total Rounds</label>
        <input
          name="totalRounds"
          type="number"
          min="1"
          max="10"
          value={form.totalRounds}
          onChange={handleChange}
          className="w-full mb-6 p-2 rounded bg-[#0f172a] border border-[#38bdf8] text-white"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded bg-[#374151] hover:bg-[#4b5563]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-gradient-to-r from-[#84cc16] to-[#06b6d4] text-white font-bold"
          >
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;