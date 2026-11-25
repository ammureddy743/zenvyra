"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PaintBucket, Redo2, Undo2 } from "lucide-react";

interface BrushTouchupCanvasProps {
  originalSrc: string;
  resultSrc: string;
  onUpdatedResult: (newDataUrl: string) => void;
}

export function BrushTouchupCanvas({
  originalSrc,
  resultSrc,
  onUpdatedResult,
}: BrushTouchupCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [mode, setMode] = useState<"erase" | "restore">("erase");
  const [brushSize, setBrushSize] = useState(28);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistoryFlags = () => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  useEffect(() => {
    let cancelled = false;
    const origImg = new Image();
    const resImg = new Image();
    origImg.crossOrigin = "anonymous";
    resImg.crossOrigin = "anonymous";

    Promise.all([
      new Promise<void>((resolve) => {
        origImg.onload = () => resolve();
        origImg.src = originalSrc;
      }),
      new Promise<void>((resolve) => {
        resImg.onload = () => resolve();
        resImg.src = resultSrc;
      }),
    ]).then(() => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = resImg.naturalWidth;
      canvas.height = resImg.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(resImg, 0, 0);

      // Keep offscreen full-res original for Restore brush
      const origCanvas = document.createElement("canvas");
      origCanvas.width = resImg.naturalWidth;
      origCanvas.height = resImg.naturalHeight;
      const origCtx = origCanvas.getContext("2d");
      origCtx?.drawImage(origImg, 0, 0, resImg.naturalWidth, resImg.naturalHeight);
      originalCanvasRef.current = origCanvas;

      const initialSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [initialSnapshot];
      historyIndexRef.current = 0;
      syncHistoryFlags();
    });

    return () => {
      cancelled = true;
    };
  }, [originalSrc, resultSrc]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      scaledRadius: (brushSize / 2) * ((scaleX + scaleY) / 2),
    };
  };

  const paintStroke = useCallback(
    (
      from: { x: number; y: number },
      to: { x: number; y: number },
      radius: number
    ) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(2, radius * 0.25))
      );

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();

        if (mode === "erase") {
          ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);
        } else if (originalCanvasRef.current) {
          ctx.drawImage(originalCanvasRef.current, 0, 0);
        }
        ctx.restore();
      }
    },
    [mode]
  );

  const commitHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(snapshot);
    if (nextHistory.length > 25) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    syncHistoryFlags();
    onUpdatedResult(canvas.toDataURL("image/png"));
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    syncHistoryFlags();
    onUpdatedResult(canvas.toDataURL("image/png"));
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    syncHistoryFlags();
    onUpdatedResult(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      {/* Brush Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode("erase")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              mode === "erase"
                ? "bg-rose-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" />
            Erase
          </button>
          <button
            type="button"
            onClick={() => setMode("restore")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              mode === "restore"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <PaintBucket className="h-3.5 w-3.5" />
            Restore
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Size</span>
          <input
            type="range"
            min={6}
            max={90}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-violet-600"
          />
          <span className="w-8 font-mono text-right">{brushSize}px</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
          >
            <Redo2 className="h-3.5 w-3.5" />
            Redo
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-checkerboard flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
            isDrawingRef.current = true;
            const pt = getCanvasPoint(e);
            lastPosRef.current = { x: pt.x, y: pt.y };
            paintStroke(lastPosRef.current, lastPosRef.current, pt.scaledRadius);
          }}
          onPointerMove={(e) => {
            if (!isDrawingRef.current || !lastPosRef.current) return;
            const pt = getCanvasPoint(e);
            paintStroke(lastPosRef.current, { x: pt.x, y: pt.y }, pt.scaledRadius);
            lastPosRef.current = { x: pt.x, y: pt.y };
          }}
          onPointerUp={() => {
            if (!isDrawingRef.current) return;
            isDrawingRef.current = false;
            lastPosRef.current = null;
            commitHistory();
          }}
          onPointerCancel={() => {
            isDrawingRef.current = false;
            lastPosRef.current = null;
          }}
          className="max-h-full max-w-full cursor-crosshair touch-none object-contain"
        />
      </div>
    </div>
  );
}
