// src/components/ViewBoard.jsx
import { useRef, useEffect } from "react";
import React from "react";

const ViewBoard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    if (!roomId || !socket) return;

    const replayOp = (op) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      switch (op.type) {
        case "begin":
          ctx.strokeStyle = op.color || "#000";
          ctx.lineWidth = op.brushSize || 4;
          ctx.beginPath();
          ctx.moveTo(op.x, op.y);
          break;
        case "line":
          ctx.lineTo(op.x, op.y);
          ctx.stroke();
          break;
        case "stop":
          ctx.closePath();
          break;
        case "clear":
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          break;
        default:
          break;
      }
    };

    const handleInit = ({ operations }) => {
      // replay full history
      operations.forEach((op) => replayOp(op));
    };

    const handleDrawOp = ({ op }) => {
      replayOp(op);
    };

    // request initial drawing operations from server
    socket.emit("fetchDrawing", { roomId });

    socket.on("initDrawing", handleInit);
    socket.on("drawOp", handleDrawOp);

    return () => {
      socket.off("initDrawing", handleInit);
      socket.off("drawOp", handleDrawOp);
    };
  }, [roomId, socket]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-[#0077B6]/50 rounded-lg shadow-lg w-full h-full bg-white"
    />
  );
};

export default React.memo(ViewBoard);