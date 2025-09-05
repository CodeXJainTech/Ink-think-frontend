// src/socket.js
import { io } from "socket.io-client";

const socket = io("https://ink-think.onrender.com", {
  autoConnect: false, // we'll call connect() when needed
});

export default socket;