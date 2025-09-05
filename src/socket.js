// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  autoConnect: false, // we'll call connect() when needed
});

export default socket;