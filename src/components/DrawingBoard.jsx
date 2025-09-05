// src/components/DrawingBoard.jsx
import { useRef, useState, useEffect } from "react";
import React from "react";

const DrawingBoard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const canDraw = true; // set externally if needed

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = isEraser ? "#FFFFFF" : color;
      ctxRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, isEraser]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    if (!canDraw || !roomId) return;
    const { x, y } = getMousePos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    isDrawing.current = true;

    socket.emit("drawOp", {
      roomId,
      op: { type: "begin", x, y, color: isEraser ? "#FFFFFF" : color, brushSize },
    });
  };

  const draw = (e) => {
    if (!isDrawing.current || !canDraw || !roomId) return;
    const { x, y } = getMousePos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();

    socket.emit("drawOp", { roomId, op: { type: "line", x, y } });
  };

  const stopDrawing = () => {
    if (!canDraw || !roomId) return;
    ctxRef.current.closePath();
    isDrawing.current = false;
    socket.emit("drawOp", { roomId, op: { type: "stop" } });
  };

  const clearCanvas = () => {
    if (!canDraw || !roomId) return;
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("drawOp", { roomId, op: { type: "clear" } });
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      <canvas
        ref={canvasRef}
        className="border border-[#0077B6]/50 rounded-lg shadow-lg w-full h-full bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="flex flex-wrap gap-2 items-center justify-center">
        <input
          type="color"
          value={color}
          disabled={isEraser || !canDraw}
          onChange={(e) => setColor(e.target.value)}
          className={`w-10 h-10 cursor-pointer rounded ${isEraser || !canDraw ? "opacity-50" : ""}`}
        />
        <input
          type="range"
          min="1"
          max="30"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          disabled={!canDraw}
        />
        <span className="text-[#ADE8F4] w-24">Size: {brushSize}</span>
        <button onClick={() => setIsEraser(!isEraser)} disabled={!canDraw}
          className={`px-3 py-1 rounded ${isEraser ? "bg-yellow-500" : "bg-[#0077B6]"} text-white text-sm`}>
          {isEraser ? "Eraser On" : "Eraser Off"}
        </button>
        <button onClick={clearCanvas} disabled={!canDraw}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
          Clear
        </button>
      </div>
    </div>
  );
};

export default React.memo(DrawingBoard);