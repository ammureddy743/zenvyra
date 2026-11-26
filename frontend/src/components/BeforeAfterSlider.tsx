"use client";

import React, { useCallback, useRef, useState } from "react";
import { MoveHorizontal, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  previewBgColor?: string | null;
  previewBgImage?: string | null;
  previewBgGradient?: string | null;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "Result",
  previewBgColor = null,
  previewBgImage = null,
  previewBgGradient = null,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const handlePointerDownSlider = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingSlider(true);
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingSlider) {
      updateSliderFromClientX(e.clientX);
    } else if (isPanning && zoom > 1) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDraggingSlider(false);
    setIsPanning(false);
  };

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    } else {
      updateSliderFromClientX(e.clientX);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      {/* Zoom Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <span>Drag slider to compare</span>
          {zoom > 1 && <span className="text-violet-500">• Drag image to pan</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = Math.max(1, +(zoom - 0.5).toFixed(1));
              setZoom(next);
              if (next === 1) setPan({ x: 0, y: 0 });
            }}
            disabled={zoom <= 1}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3.2rem] text-center font-mono font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)))}
            disabled={zoom >= 3}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="ml-1 flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Reset zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Comparison Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 select-none touch-none ${
          previewBgColor || previewBgImage || previewBgGradient ? "" : "bg-checkerboard"
        } ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-ew-resize"}`}
        style={
          previewBgImage
            ? {
                backgroundImage: `url(${previewBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : previewBgGradient
            ? { backgroundImage: previewBgGradient }
            : previewBgColor
            ? { backgroundColor: previewBgColor }
            : undefined
        }
      >
        {/* Transformable Layer */}
        <div
          className="relative h-full w-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
        >
          {/* After (Result) */}
          <img
            src={afterSrc}
            alt={afterLabel}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          />

          {/* Before (Original) clipped to sliderPos */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={beforeSrc}
              alt={beforeLabel}
              draggable={false}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Labels */}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {afterLabel}
        </span>

        {/* Divider Line & Handle */}
        <div
          onPointerDown={handlePointerDownSlider}
          role="slider"
          tabIndex={0}
          aria-label="Before and after comparison"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPos)}
          aria-valuetext={`${Math.round(sliderPos)} percent of original visible`}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 2;
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              setSliderPos((position) => Math.max(0, position - step));
            } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              setSliderPos((position) => Math.min(100, position + step));
            } else if (event.key === "Home") {
              event.preventDefault();
              setSliderPos(0);
            } else if (event.key === "End") {
              event.preventDefault();
              setSliderPos(100);
            }
          }}
          className="absolute inset-y-0 z-10 w-0.5 cursor-ew-resize bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white shadow-lg">
            <MoveHorizontal className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
