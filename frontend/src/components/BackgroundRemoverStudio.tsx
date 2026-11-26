"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Brush,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Palette,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  SplitSquareHorizontal,
  Trash2,
  Wand2,
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
type BackdropMode = "transparent" | "color" | "gradient" | "image";

const COLOR_SWATCHES = [
  "#ffffff",
  "#f4f4f5",
  "#18181b",
  "#dbeafe",
  "#fce7f3",
  "#dcfce7",
];

const GRADIENT_PRESETS = [
  {
    id: "studio-violet",
    label: "Studio Violet",
    css: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #06b6d4 100%)",
    stops: ["#4c1d95", "#7c3aed", "#06b6d4"],
  },
  {
    id: "sunset-warm",
    label: "Sunset",
    css: "linear-gradient(135deg, #f97316 0%, #ec4899 55%, #8b5cf6 100%)",
    stops: ["#f97316", "#ec4899", "#8b5cf6"],
  },
  {
    id: "ocean-mint",
    label: "Ocean",
    css: "linear-gradient(135deg, #0f172a 0%, #0284c7 55%, #2dd4bf 100%)",
    stops: ["#0f172a", "#0284c7", "#2dd4bf"],
  },
  {
    id: "obsidian",
    label: "Obsidian",
    css: "linear-gradient(135deg, #09090b 0%, #27272a 55%, #52525b 100%)",
    stops: ["#09090b", "#27272a", "#52525b"],
  },
];

const SAMPLES = [
  {
    id: "camera",
    label: "Studio Camera",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#27272a"/><stop offset="50%" stop-color="#52525b"/><stop offset="100%" stop-color="#18181b"/></linearGradient>
        <linearGradient id="lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#06b6d4"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)"/>
      <rect x="0" y="425" width="800" height="175" fill="#334155"/>
      <rect x="210" y="190" width="380" height="235" rx="28" fill="url(#metal)" stroke="#71717a" stroke-width="3"/>
      <path d="M315 190 L345 135 Q355 125 370 125 L430 125 Q445 125 455 135 L485 190 Z" fill="url(#metal)" stroke="#71717a" stroke-width="3"/>
      <circle cx="410" cy="308" r="105" fill="#09090b" stroke="#71717a" stroke-width="5"/>
      <circle cx="410" cy="308" r="76" fill="#18181b"/>
      <circle cx="410" cy="308" r="58" fill="url(#lens)"/>
      <ellipse cx="388" cy="285" rx="20" ry="11" transform="rotate(-25 388 285)" fill="#ffffff" opacity="0.35"/>
    </svg>`,
  },
  {
    id: "watch",
    label: "Luxury Watch",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bgw" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f766e"/><stop offset="100%" stop-color="#1e293b"/></linearGradient>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e4e4e7"/><stop offset="100%" stop-color="#52525b"/></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bgw)"/>
      <rect x="342" y="85" width="116" height="125" rx="16" fill="#18181b"/>
      <rect x="342" y="390" width="116" height="125" rx="16" fill="#18181b"/>
      <circle cx="400" cy="300" r="122" fill="url(#steel)"/>
      <circle cx="400" cy="300" r="100" fill="#09090b"/>
      <line x1="400" y1="300" x2="400" y2="232" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
      <line x1="400" y1="300" x2="454" y2="330" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "bottle",
    label: "Studio Perfume",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bgp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#831843"/><stop offset="100%" stop-color="#312e81"/></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f9a8d4"/><stop offset="100%" stop-color="#a855f7"/></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bgp)"/>
      <rect x="355" y="105" width="90" height="75" rx="12" fill="#e4e4e7"/>
      <rect x="372" y="180" width="56" height="32" fill="#a1a1aa"/>
      <rect x="290" y="212" width="220" height="275" rx="36" fill="url(#glass)" stroke="#ffffff" stroke-opacity="0.6" stroke-width="4"/>
      <rect x="335" y="285" width="130" height="95" rx="12" fill="#ffffff" opacity="0.9"/>
    </svg>`,
  },
];

async function svgToPngFile(svg: string, filename: string): Promise<File> {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load sample."));
      img.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0, 800, 600);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas failed"))), "image/png");
    });
    return new File([pngBlob], filename, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function BackgroundRemoverStudio() {
  const { credits, consumeCredit } = useCredits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  const [model, setModel] = useState<BgModel>("u2netp");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");

  const [backdropMode, setBackdropMode] = useState<BackdropMode>("transparent");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [gradientId, setGradientId] = useState<string>(GRADIENT_PRESETS[0].id);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [bgPrompt, setBgPrompt] = useState<string>("");
  const [isGeneratingBg, setIsGeneratingBg] = useState<boolean>(false);

  const [feather, setFeather] = useState<number>(0);
  const [smooth, setSmooth] = useState<number>(0);
  const [shiftEdge, setShiftEdge] = useState<number>(0);

  const [studioView, setStudioView] = useState<StudioView>("compare");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
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

  const executeRemoval = useCallback(
    async (targetFile: File) => {
      if (credits <= 0) {
        setErrorMsg("You have used all daily free credits. They reset tomorrow.");
        return;
      }

      setIsProcessing(true);
      setErrorMsg(null);

      try {
        const formData = new FormData();
        formData.append("file", targetFile);
        formData.append("model", model);
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
            // fallback
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
          err instanceof Error ? err.message : "Could not reach the AI server.";
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
    },
    [credits, model, bgColor, feather, smooth, shiftEdge, consumeCredit]
  );

  const handleSelectedFile = useCallback(
    (selected: File) => {
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
      // Picsart-style instant auto-cutout on upload
      void executeRemoval(selected);
    },
    [executeRemoval]
  );

  const handleSampleClick = async (sample: (typeof SAMPLES)[number]) => {
    try {
      const sampleFile = await svgToPngFile(sample.svg, `${sample.id}-sample.png`);
      handleSelectedFile(sampleFile);
    } catch {
      setErrorMsg("Could not load sample image.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleSelectedFile(dropped);
  };

  const runRemoval = () => {
    if (file) void executeRemoval(file);
  };

  const handleGenerateAiBackdrop = async () => {
    const clean = bgPrompt.trim();
    if (clean.length < 2) {
      setErrorMsg("Enter a short scene description for your AI background.");
      return;
    }
    if (credits <= 0) {
      setErrorMsg("Daily free credits exhausted.");
      return;
    }
    setIsGeneratingBg(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("prompt", clean);
      formData.append("style", "photorealistic");
      formData.append("width", "1024");
      formData.append("height", "768");

      const res = await fetch(`${API_BASE}/api/v1/generate-image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "AI background generation failed.");
      }
      const blob = await res.blob();
      setBgImageUrl(URL.createObjectURL(blob));
      setBackdropMode("image");
      consumeCredit();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to generate background."
      );
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    if (exportFormat === "png" && backdropMode === "transparent") {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `${baseName}-zenvyra-cutout.png`;
      a.click();
      return;
    }

    const fg = new Image();
    fg.crossOrigin = "anonymous";
    fg.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = fg.naturalWidth;
      canvas.height = fg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (backdropMode === "color" || (backdropMode === "transparent" && exportFormat === "jpeg")) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (backdropMode === "gradient") {
        const preset =
          GRADIENT_PRESETS.find((g) => g.id === gradientId) || GRADIENT_PRESETS[0];
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, preset.stops[0]);
        grad.addColorStop(0.55, preset.stops[1]);
        grad.addColorStop(1, preset.stops[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (backdropMode === "image" && bgImageUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          bgImg.onload = () => resolve();
          bgImg.onerror = () => resolve();
          bgImg.src = bgImageUrl;
        });
        if (bgImg.naturalWidth > 0) {
          const scale = Math.max(
            canvas.width / bgImg.naturalWidth,
            canvas.height / bgImg.naturalHeight
          );
          const drawW = bgImg.naturalWidth * scale;
          const drawH = bgImg.naturalHeight * scale;
          ctx.drawImage(
            bgImg,
            (canvas.width - drawW) / 2,
            (canvas.height - drawH) / 2,
            drawW,
            drawH
          );
        }
      }

      ctx.drawImage(fg, 0, 0);
      const mime = exportFormat === "png" ? "image/png" : "image/jpeg";
      const ext = exportFormat === "png" ? "png" : "jpg";
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${baseName}-zenvyra.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
        },
        mime,
        0.96
      );
    };
    fg.src = resultUrl;
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
    setBackdropMode("transparent");
    setStudioView("compare");
  };

  const activeGradient =
    GRADIENT_PRESETS.find((g) => g.id === gradientId)?.css ||
    GRADIENT_PRESETS[0].css;

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
            Instant full-resolution cutouts, custom colors, gradients, AI backdrops, and touch-up brush.
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
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex min-h-[260px] sm:min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 sm:p-8 text-center transition-all ${
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
              Drag &amp; drop your photo for instant cutout
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Auto-removes background immediately • JPG, PNG, WebP up to 20 MB
            </p>
            <button
              type="button"
              className="mt-6 rounded-xl bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              Upload Image
            </button>
          </div>

          {/* One-Click Sample Photos */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              No image? Try a sample:
            </span>
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-200 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-violet-500" />
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Canvas / Slider Area */}
          <div className="lg:col-span-8 space-y-4">
            {resultUrl ? (
              <>
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
                    previewBgColor={backdropMode === "color" ? bgColor : null}
                    previewBgGradient={
                      backdropMode === "gradient" ? activeGradient : null
                    }
                    previewBgImage={
                      backdropMode === "image" ? bgImageUrl : null
                    }
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
                    <p className="text-xs text-zinc-300 mt-1">Model: {model}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-5">
              {/* Backdrop Swapper (Picsart-style) */}
              {resultUrl && (
                <div className="space-y-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Palette className="h-3.5 w-3.5" />
                    Background Backdrop
                  </div>

                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 p-1 text-[11px] font-semibold">
                    {(
                      [
                        { id: "transparent", label: "None" },
                        { id: "color", label: "Color" },
                        { id: "gradient", label: "Gradient" },
                        { id: "image", label: "Photo/AI" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBackdropMode(tab.id)}
                        className={`rounded-lg py-1.5 transition-colors ${
                          backdropMode === tab.id
                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {backdropMode === "color" && (
                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBgColor(c)}
                          aria-label={`Set background color ${c}`}
                          className={`h-7 w-7 rounded-full border transition-transform ${
                            bgColor === c
                              ? "border-violet-500 ring-2 ring-violet-500/40 scale-110"
                              : "border-zinc-300 dark:border-zinc-700"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        title="Custom color"
                        className="h-7 w-9 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                    </div>
                  )}

                  {backdropMode === "gradient" && (
                    <div className="grid grid-cols-2 gap-2">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGradientId(g.id)}
                          className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition-all ${
                            gradientId === g.id
                              ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/30"
                              : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <span
                            className="h-5 w-5 shrink-0 rounded-full"
                            style={{ backgroundImage: g.css }}
                          />
                          <span className="truncate">{g.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {backdropMode === "image" && (
                    <div className="space-y-2.5">
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setBgImageUrl(URL.createObjectURL(f));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => bgFileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 py-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Upload Custom Background
                      </button>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={bgPrompt}
                          onChange={(e) => setBgPrompt(e.target.value)}
                          placeholder="Or AI scene (e.g. marble table)"
                          className="min-w-0 flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-violet-500"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAiBackdrop}
                          disabled={isGeneratingBg}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {isGeneratingBg ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="h-3.5 w-3.5" />
                          )}
                          AI
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

              {/* Re-process Action */}
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
                      onClick={() => setExportFormat("png")}
                      className={`rounded-lg border py-2 font-medium ${
                        exportFormat === "png"
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExportFormat("jpeg");
                        if (backdropMode === "transparent") setBackdropMode("color");
                      }}
                      className={`rounded-lg border py-2 font-medium ${
                        exportFormat === "jpeg"
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      JPEG (96%)
                    </button>
                  </div>

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
