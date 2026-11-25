"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eraser,
  ImagePlus,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { useCredits } from "./CreditsContext";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export function ObjectRemoverStudio() {
  const { credits, consumeCredit } = useCredits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(32);
  const [hasMask, setHasMask] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initCanvases = useCallback((url: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;
      overlay.width = img.naturalWidth;
      overlay.height = img.naturalHeight;
      const oCtx = overlay.getContext("2d");
      oCtx?.drawImage(img, 0, 0);

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = img.naturalWidth;
      maskCanvas.height = img.naturalHeight;
      const mCtx = maskCanvas.getContext("2d");
      if (mCtx) {
        mCtx.fillStyle = "#000000";
        mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
      maskCanvasRef.current = maskCanvas;
      setHasMask(false);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    if (originalUrl && !resultUrl) {
      initCanvases(originalUrl);
    }
  }, [originalUrl, resultUrl, initCanvases]);

  const handleSelectedFile = useCallback((selected: File) => {
    setErrorMsg(null);
    setResultUrl(null);
    setProcessingMs(null);
    if (!ACCEPTED_TYPES.has(selected.type.toLowerCase())) {
      setErrorMsg("Unsupported format. Please upload JPG, PNG, or WebP.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setErrorMsg("File exceeds 20 MB limit.");
      return;
    }
    setFile(selected);
    setOriginalUrl(URL.createObjectURL(selected));
  }, []);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      radius: (brushSize / 2) * ((scaleX + scaleY) / 2),
    };
  };

  const paintMask = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    radius: number
  ) => {
    const overlayCtx = overlayCanvasRef.current?.getContext("2d");
    const maskCtx = maskCanvasRef.current?.getContext("2d");
    if (!overlayCtx || !maskCtx) return;

    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(2, radius * 0.25))
    );

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;

      overlayCtx.fillStyle = "rgba(244, 63, 94, 0.45)";
      overlayCtx.beginPath();
      overlayCtx.arc(x, y, radius, 0, Math.PI * 2);
      overlayCtx.fill();

      maskCtx.fillStyle = "#ffffff";
      maskCtx.beginPath();
      maskCtx.arc(x, y, radius, 0, Math.PI * 2);
      maskCtx.fill();
    }
    setHasMask(true);
  };

  const clearMask = () => {
    if (originalUrl) {
      setResultUrl(null);
      initCanvases(originalUrl);
    }
  };

  const runRemoval = async () => {
    if (!file || !maskCanvasRef.current) return;
    if (!hasMask) {
      setErrorMsg("Paint over the object you want to remove first.");
      return;
    }
    if (credits <= 0) {
      setErrorMsg("Daily free credits exhausted.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const maskBlob = await new Promise<Blob | null>((resolve) =>
        maskCanvasRef.current!.toBlob(resolve, "image/png")
      );
      if (!maskBlob) throw new Error("Failed to generate mask.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mask", maskBlob, "mask.png");
      formData.append("export_format", exportFormat);

      const res = await fetch(`${API_BASE}/api/v1/remove-object`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Object removal failed.");
      }

      const ms = res.headers.get("X-Processing-Ms");
      if (ms) setProcessingMs(Number(ms));

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      consumeCredit();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Object removal failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const base = file.name.replace(/\.[^/.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}-zenvyra-cleaned.${exportFormat === "jpeg" ? "jpg" : "png"}`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
            <Eraser className="h-3.5 w-3.5" />
            Tool 3 • Object Remover
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            AI Object Remover
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Brush over unwanted objects, people, or blemishes to remove them seamlessly.
          </p>
        </div>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setOriginalUrl(null);
              setResultUrl(null);
              setErrorMsg(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <Trash2 className="h-3.5 w-3.5" />
            New Image
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-sm text-rose-900 dark:text-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {!originalUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleSelectedFile(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20"
              : "border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-violet-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleSelectedFile(f);
            }}
          />
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <ImagePlus className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">Drag &amp; drop a photo to clean up</h2>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            JPG, PNG, WebP up to 20 MB
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-3">
            {resultUrl ? (
              <>
                {processingMs !== null && (
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={clearMask}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Paint Another Mask
                    </button>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Cleaned in {(processingMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                )}
                <BeforeAfterSlider
                  beforeSrc={originalUrl}
                  afterSrc={resultUrl}
                  beforeLabel="Original"
                  afterLabel="Cleaned"
                />
              </>
            ) : (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <canvas
                  ref={overlayCanvasRef}
                  onPointerDown={(e) => {
                    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
                    isDrawingRef.current = true;
                    const pt = getPoint(e);
                    lastPtRef.current = { x: pt.x, y: pt.y };
                    paintMask(lastPtRef.current, lastPtRef.current, pt.radius);
                  }}
                  onPointerMove={(e) => {
                    if (!isDrawingRef.current || !lastPtRef.current) return;
                    const pt = getPoint(e);
                    paintMask(lastPtRef.current, { x: pt.x, y: pt.y }, pt.radius);
                    lastPtRef.current = { x: pt.x, y: pt.y };
                  }}
                  onPointerUp={() => {
                    isDrawingRef.current = false;
                    lastPtRef.current = null;
                  }}
                  className="max-h-full max-w-full cursor-crosshair touch-none object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-400 mb-3" />
                    <p className="text-sm font-semibold">Removing masked object...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Brush Size</span>
                  <span className="font-mono text-zinc-500">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={100}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>

              <button
                type="button"
                onClick={clearMask}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 py-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Mask
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(["png", "jpeg"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setExportFormat(fmt)}
                    className={`rounded-lg border py-2 font-medium uppercase ${
                      exportFormat === fmt
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {fmt === "jpeg" ? "JPEG (96%)" : "PNG (Lossless)"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={runRemoval}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Eraser className="h-4 w-4" />
                    Remove Object
                  </>
                )}
              </button>

              {resultUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900"
                >
                  <Download className="h-4 w-4" />
                  Download {exportFormat.toUpperCase()}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
