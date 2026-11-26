"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  Wand2,
} from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { useCredits } from "./CreditsContext";
import { useToolHandoff } from "./ToolHandoffContext";
import { SendToToolBar } from "./SendToToolBar";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export function PhotoRestorerStudio() {
  const searchParams = useSearchParams();
  const { credits, consumeCredit } = useCredits();
  const { consumePendingFile } = useToolHandoff();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [enhanceDetails, setEnhanceDetails] = useState(true);
  const [colorize, setColorize] = useState(searchParams.get("colorize") === "1");
  const [denoiseStrength, setDenoiseStrength] = useState(1.0);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("colorize") === "1") setColorize(true);
  }, [searchParams]);

  useEffect(() => {
    const incoming = consumePendingFile();
    if (incoming) handleSelectedFile(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const runRestore = async () => {
    if (!file) return;
    if (credits <= 0) {
      setErrorMsg("Daily free credits exhausted.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("enhance_details", String(enhanceDetails));
      formData.append("colorize", String(colorize));
      formData.append("denoise_strength", String(denoiseStrength));
      formData.append("export_format", exportFormat);

      const res = await fetch(`${API_BASE}/api/v1/restore-photo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Restoration failed.");
      }

      const ms = res.headers.get("X-Processing-Ms");
      if (ms) setProcessingMs(Number(ms));

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      consumeCredit();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Restoration failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const base = file.name.replace(/\.[^/.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}-zenvyra-restored.${exportFormat === "jpeg" ? "jpg" : "png"}`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
            <Wand2 className="h-3.5 w-3.5" />
            Tool 4 • Old Photo Restorer
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            AI Old Photo Restorer
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Recover faded contrast, reduce grain, sharpen faces, and colorize vintage photos.
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
          className={`flex min-h-[260px] sm:min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 sm:p-8 text-center transition-all ${
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
          <h2 className="text-lg font-semibold">Drag &amp; drop an old or faded photo</h2>
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
                  <div className="flex items-center justify-end gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Restored in {(processingMs / 1000).toFixed(2)}s
                  </div>
                )}
                <BeforeAfterSlider
                  beforeSrc={originalUrl}
                  afterSrc={resultUrl}
                  beforeLabel="Original"
                  afterLabel="Restored"
                />
              </>
            ) : (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <img
                  src={originalUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-400 mb-3" />
                    <p className="text-sm font-semibold">Restoring photo...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-5">
              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Enhance Face &amp; Details</span>
                <input
                  type="checkbox"
                  checked={enhanceDetails}
                  onChange={(e) => setEnhanceDetails(e.target.checked)}
                  className="h-4 w-4 accent-violet-600"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Colorize Monochrome Photo</span>
                <input
                  type="checkbox"
                  checked={colorize}
                  onChange={(e) => setColorize(e.target.checked)}
                  className="h-4 w-4 accent-violet-600"
                />
              </label>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Denoise &amp; Dust Removal</span>
                  <span className="font-mono text-zinc-500">
                    {denoiseStrength.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.2}
                  value={denoiseStrength}
                  onChange={(e) => setDenoiseStrength(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>

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
                onClick={runRestore}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : resultUrl ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Re-process
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Restore Photo
                  </>
                )}
              </button>

              {resultUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download {exportFormat.toUpperCase()}
                  </button>
                  <SendToToolBar
                    imageUrl={resultUrl}
                    filename={file?.name || "zenvyra-restored.png"}
                    currentTool="photo-restorer"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
