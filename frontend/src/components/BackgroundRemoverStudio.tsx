"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Brush,
  CheckCircle2,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  SplitSquareHorizontal,
  Trash2,
} from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { BrushTouchupCanvas } from "./BrushTouchupCanvas";
import { useCredits } from "./CreditsContext";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

type BgModel = "u2netp" | "isnet-general-use" | "birefnet-general";
type ExportFormat = "png" | "jpeg";
type StudioView = "compare" | "brush";

export function BackgroundRemoverStudio() {
  const { credits, consumeCredit } = useCredits();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  const [model, setModel] = useState<BgModel>("u2netp");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [useSolidPreview, setUseSolidPreview] = useState<boolean>(false);

  const [feather, setFeather] = useState<number>(0);
  const [smooth, setSmooth] = useState<number>(0);
  const [shiftEdge, setShiftEdge] = useState<number>(0);

  const [studioView, setStudioView] = useState<StudioView>("compare");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [processingMs, setProcessingMs] = useState<number | null>(null);

  useEffect(() => {
    // Wake up the backend (e.g. Render free tier) as soon as the user opens the studio
    fetch(`${API_BASE}/health`).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      setElapsedSec(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isProcessing]);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectedFile = useCallback((selected: File) => {
    setErrorMsg(null);
    setQualityWarning(null);
    setResultUrl(null);
    setProcessingMs(null);
    setStudioView("compare");

    if (!ACCEPTED_TYPES.has(selected.type.toLowerCase())) {
      setErrorMsg("Unsupported format. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (selected.size > MAX_BYTES) {
      setErrorMsg("File is larger than 20 MB. Please choose a smaller image.");
      return;
    }

    const objectUrl = URL.createObjectURL(selected);
    const probe = new Image();
    probe.onload = () => {
      const w = probe.naturalWidth;
      const h = probe.naturalHeight;
      setDimensions({ w, h });
      if (Math.min(w, h) < 400) {
        setQualityWarning(
          `Low resolution input (${w}×${h}px). For sharpest cutouts, use an image at least 600px on its shortest side.`
        );
      }
    };
    probe.src = objectUrl;

    setFile(selected);
    setOriginalUrl(objectUrl);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleSelectedFile(dropped);
  };

  const runRemoval = async () => {
    if (!file) return;
    if (credits <= 0) {
      setErrorMsg("You have used all daily free credits. They reset tomorrow.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", model);
      // Always request lossless RGBA PNG from backend so slider & brush work cleanly
      formData.append("export_format", "png");
      formData.append("bg_color", bgColor);
      formData.append("feather", String(feather));
      formData.append("smooth", String(smooth));
      formData.append("shift_edge", String(shiftEdge));

      const response = await fetch(`${API_BASE}/api/v1/remove-background`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "Failed to process image.";
        try {
          const errJson = await response.json();
          if (errJson?.detail) detail = errJson.detail;
        } catch {
          // fallback to generic message
        }
        throw new Error(detail);
      }

      const serverWarning = response.headers.get("X-Quality-Warning");
      if (serverWarning) setQualityWarning(serverWarning);

      const msHeader = response.headers.get("X-Processing-Ms");
      if (msHeader) setProcessingMs(Number(msHeader));

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      consumeCredit();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not reach the AI server.";
      if (msg.toLowerCase().includes("failed to fetch")) {
        setErrorMsg(
          `Cannot connect to the AI backend at ${API_BASE}. Make sure the FastAPI server is running.`
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    if (exportFormat === "png") {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `${baseName}-zenvyra-cutout.png`;
      a.click();
      return;
    }

    // Export full-resolution JPEG at 96% quality with selected background color
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${baseName}-zenvyra-cutout.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.96
      );
    };
    img.src = resultUrl;
  };

  const resetAll = () => {
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setDimensions(null);
    setQualityWarning(null);
    setErrorMsg(null);
    setProcessingMs(null);
    setFeather(0);
    setSmooth(0);
    setShiftEdge(0);
    setStudioView("compare");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Tool 1 • Background Remover
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            AI Background Remover
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Full-resolution cutouts with BiRefNet &amp; IS-Net, edge refinement, and manual touch-up brush.
          </p>
        </div>

        {file && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            New Image
          </button>
        )}
      </div>

      {/* Alerts */}
      {qualityWarning && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-semibold">Low-Quality Input Warning</p>
            <p className="text-xs mt-0.5 opacity-90">{qualityWarning}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-300/80 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-sm text-rose-900 dark:text-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-xs mt-0.5 opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Upload Dropzone OR Studio Grid */}
      {!originalUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex min-h-[260px] sm:min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 sm:p-8 text-center transition-all ${
            isDragging
              ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20"
              : "border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-violet-400 dark:hover:border-violet-700"
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
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/15 to-cyan-500/15 text-violet-600 dark:text-violet-400">
            <ImagePlus className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">
            Drag &amp; drop your photo here
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Supports JPG, PNG, and WebP up to 20 MB • Processed at full resolution
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Choose File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Canvas / Slider Area */}
          <div className="lg:col-span-8 space-y-4">
            {resultUrl ? (
              <>
                {/* View Mode Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setStudioView("compare")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                        studioView === "compare"
                          ? "bg-violet-600 text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <SplitSquareHorizontal className="h-3.5 w-3.5" />
                      Before / After
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioView("brush")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                        studioView === "brush"
                          ? "bg-violet-600 text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <Brush className="h-3.5 w-3.5" />
                      Touch-Up Brush
                    </button>
                  </div>

                  {processingMs !== null && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Done in {(processingMs / 1000).toFixed(2)}s
                      {dimensions ? ` • ${dimensions.w}×${dimensions.h}px` : ""}
                    </span>
                  )}
                </div>

                {studioView === "compare" ? (
                  <BeforeAfterSlider
                    beforeSrc={originalUrl}
                    afterSrc={resultUrl}
                    previewBgColor={useSolidPreview ? bgColor : null}
                  />
                ) : (
                  <BrushTouchupCanvas
                    originalSrc={originalUrl}
                    resultSrc={resultUrl}
                    onUpdatedResult={(newDataUrl) => setResultUrl(newDataUrl)}
                  />
                )}
              </>
            ) : (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <img
                  src={originalUrl}
                  alt="Uploaded preview"
                  className="max-h-full max-w-full object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white p-6 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-400 mb-3" />
                    <p className="text-sm font-semibold">
                      Removing background at full resolution... ({elapsedSec}s)
                    </p>
                    <p className="text-xs text-zinc-300 mt-1">
                      Model: {model}
                    </p>
                    {elapsedSec >= 6 && (
                      <p className="text-[11px] text-zinc-400 mt-2 max-w-xs">
                        First-time use downloads and caches the AI model once; subsequent edits are much faster.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-5">
              {/* Model Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  AI Segmentation Model
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    [
                      {
                        id: "u2netp",
                        title: "U2-Net Fast (Recommended)",
                        desc: "Fastest (~1–3s) & works on free cloud tier",
                      },
                      {
                        id: "isnet-general-use",
                        title: "IS-Net General Use",
                        desc: "Sharper product & portrait edges (~179 MB)",
                      },
                      {
                        id: "birefnet-general",
                        title: "BiRefNet General",
                        desc: "Best hair detail (needs 2 GB+ RAM)",
                      },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModel(m.id)}
                      className={`text-left rounded-xl border p-3 transition-all ${
                        model === m.id
                          ? "border-violet-500 bg-violet-50/70 dark:bg-violet-950/30"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-sm font-semibold">{m.title}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {m.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Edge Refinement Sliders */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Edge Refinement
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Feather</span>
                    <span className="font-mono text-zinc-500">{feather}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={feather}
                    onChange={(e) => setFeather(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Smooth</span>
                    <span className="font-mono text-zinc-500">{smooth}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={smooth}
                    onChange={(e) => setSmooth(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Shift Edge</span>
                    <span className="font-mono text-zinc-500">
                      {shiftEdge > 0 ? `+${shiftEdge}` : shiftEdge}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={1}
                    value={shiftEdge}
                    onChange={(e) => setShiftEdge(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>
              </div>

              {/* Primary Process Action */}
              <button
                type="button"
                onClick={runRemoval}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-opacity"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : resultUrl ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Re-process with Settings
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Remove Background
                  </>
                )}
              </button>

              {/* Export Section */}
              {resultUrl && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Export Full Resolution
                  </label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setExportFormat("png");
                        setUseSolidPreview(false);
                      }}
                      className={`rounded-lg border py-2 font-medium ${
                        exportFormat === "png"
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      PNG (Transparent)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExportFormat("jpeg");
                        setUseSolidPreview(true);
                      }}
                      className={`rounded-lg border py-2 font-medium ${
                        exportFormat === "jpeg"
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      JPEG (96% Quality)
                    </button>
                  </div>

                  {exportFormat === "jpeg" && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Background Color
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="h-7 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                        <span className="font-mono uppercase">{bgColor}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                    Download {exportFormat.toUpperCase()}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
