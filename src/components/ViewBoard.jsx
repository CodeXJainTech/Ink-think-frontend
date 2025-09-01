import { useRef, useEffect } from "react";
import React from "react";
import socket from "../socket";

const ViewBoard = ({ roomId }) => {
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
    if (!roomId) return;

    socket.on("beginPath", ({ x, y, color, brushSize }) => {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = brushSize;
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    });

    socket.on("drawBatch", ({ points }) => {
      points.forEach(({ x, y }) => {
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();
      });
    });

    socket.on("stopDrawing", () => {
      ctxRef.current.closePath();
    });

    socket.on("clearCanvas", () => {
      const canvas = canvasRef.current;
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("beginPath");
      socket.off("drawBatch");
      socket.off("stopDrawing");
      socket.off("clearCanvas");
    };
  }, [roomId]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-[#0077B6]/50 rounded-lg shadow-lg w-full h-full bg-white"
    />
  );
};

export default React.memo(ViewBoard);