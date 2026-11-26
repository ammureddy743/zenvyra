"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Film,
  ImageIcon,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useCredits } from "./CreditsContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

type MediaMode = "image" | "video";
type MotionType = "zoom-in" | "zoom-out" | "pan-left" | "pan-right";

const STYLES = [
  { id: "photorealistic", label: "Photorealistic" },
  { id: "digital-art", label: "Digital Art" },
  { id: "anime", label: "Anime" },
  { id: "3d-render", label: "3D Render" },
  { id: "minimalist", label: "Minimalist" },
];

const RATIOS = [
  { id: "1:1", label: "1:1 Square", w: 1024, h: 1024, vw: 640, vh: 640 },
  { id: "16:9", label: "16:9 Landscape", w: 1280, h: 720, vw: 768, vh: 432 },
  { id: "9:16", label: "9:16 Portrait", w: 720, h: 1280, vw: 432, vh: 768 },
];

const MOTIONS: { id: MotionType; label: string }[] = [
  { id: "zoom-in", label: "Zoom In" },
  { id: "zoom-out", label: "Zoom Out" },
  { id: "pan-left", label: "Pan Left" },
  { id: "pan-right", label: "Pan Right" },
];

export function ImageGeneratorStudio() {
  const searchParams = useSearchParams();
  const { credits, consumeCredit } = useCredits();
  const autoRanRef = useRef(false);

  const initialMode: MediaMode =
    searchParams.get("mode") === "video" ? "video" : "image";

  const [mode, setMode] = useState<MediaMode>(initialMode);
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [style, setStyle] = useState("photorealistic");
  const [ratioId, setRatioId] = useState(
    initialMode === "video" ? "16:9" : "1:1"
  );
  const [motion, setMotion] = useState<MotionType>("zoom-in");
  const [durationSec, setDurationSec] = useState<3 | 5>(3);

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [generatedKind, setGeneratedKind] = useState<MediaMode>("image");
  const [generatedStyle, setGeneratedStyle] = useState<string>("photorealistic");
  const [generatedRatioId, setGeneratedRatioId] = useState<string>(
    initialMode === "video" ? "16:9" : "1:1"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSec(0);
      return;
    }
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isGenerating]);

  const runGeneration = useCallback(
    async (textToGenerate?: string, modeOverride?: MediaMode) => {
      const targetMode = modeOverride ?? mode;
      const finalPrompt = (textToGenerate ?? prompt).trim();
      if (finalPrompt.length < 2) {
        setErrorMsg(
          `Please enter a prompt describing the ${targetMode} you want to create.`
        );
        return;
      }
      if (credits <= 0) {
        setErrorMsg("Daily free credits exhausted.");
        return;
      }

      const ratio = RATIOS.find((r) => r.id === ratioId) || RATIOS[0];
      setIsGenerating(true);
      setErrorMsg(null);
      setProcessingMs(null);

      try {
        const formData = new FormData();
        formData.append("prompt", finalPrompt);
        formData.append("style", style);

        if (targetMode === "video") {
          formData.append("motion", motion);
          formData.append("duration_sec", String(durationSec));
          formData.append("width", String(ratio.vw));
          formData.append("height", String(ratio.vh));
        } else {
          formData.append("width", String(ratio.w));
          formData.append("height", String(ratio.h));
        }

        const endpoint =
          targetMode === "video" ? "generate-video" : "generate-image";

        const res = await fetch(`${API_BASE}/api/v1/${endpoint}`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(
            err?.detail || `${targetMode === "video" ? "Video" : "Image"} generation failed.`
          );
        }

        const ms = res.headers.get("X-Processing-Ms");
        if (ms) setProcessingMs(Number(ms));

        const blob = await res.blob();
        setMediaUrl(URL.createObjectURL(blob));
        setGeneratedKind(targetMode);
        setGeneratedStyle(style);
        setGeneratedRatioId(ratioId);
        consumeCredit();
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to generate media."
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, style, ratioId, mode, motion, durationSec, credits, consumeCredit]
  );

  useEffect(() => {
    const initialPrompt = searchParams.get("prompt");
    const urlMode: MediaMode =
      searchParams.get("mode") === "video" ? "video" : "image";
    if (initialPrompt && !autoRanRef.current) {
      autoRanRef.current = true;
      setMode(urlMode);
      if (urlMode === "video") setRatioId("16:9");
      setPrompt(initialPrompt);
      runGeneration(initialPrompt, urlMode);
    }
  }, [searchParams, runGeneration]);

  const handleDownload = () => {
    if (!mediaUrl) return;
    const a = document.createElement("a");
    a.href = mediaUrl;
    a.download =
      generatedKind === "video"
        ? "zenvyra-motion-video.webp"
        : "zenvyra-generated.jpg";
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          AI Image &amp; Video Generator
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Create Images &amp; Motion Videos from Prompts
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Describe anything you imagine—switch between high-resolution images and animated motion clips.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-sm text-rose-900 dark:text-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Preview */}
        <div className="lg:col-span-8 space-y-3">
          {processingMs !== null && mediaUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-violet-600 dark:text-violet-400">
                {generatedKind === "video" ? (
                  <>
                    <Film className="h-3.5 w-3.5" />
                    Motion Video ({durationSec}s loop • {STYLES.find((s) => s.id === generatedStyle)?.label ?? generatedStyle})
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3.5 w-3.5" />
                    High-Res Image • {STYLES.find((s) => s.id === generatedStyle)?.label ?? generatedStyle}
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Generated in {(processingMs / 1000).toFixed(2)}s
              </span>
            </div>
          )}

          {(() => {
            const activeRatio = mediaUrl ? generatedRatioId : ratioId;
            const frameClass =
              activeRatio === "16:9"
                ? "aspect-video w-full"
                : activeRatio === "9:16"
                ? "aspect-[9/16] w-full max-w-[360px] mx-auto"
                : "aspect-square w-full max-w-[540px] mx-auto";
            return (
              <div
                className={`relative ${frameClass} overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center`}
              >
                {mediaUrl ? (
                  <img
                    src={mediaUrl}
                    alt={prompt || "Generated AI media"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 sm:p-8 text-zinc-500 dark:text-zinc-400">
                    <Wand2 className="h-10 w-10 mx-auto mb-3 text-violet-500 opacity-70" />
                    <p className="text-sm font-medium">
                      Enter a prompt and click Generate {mode === "video" ? "Video" : "Image"}
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white p-6 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-400 mb-3" />
                    <p className="text-sm font-semibold">
                      {mode === "video"
                        ? `Rendering ${durationSec}s motion video... (${elapsedSec}s)`
                        : `Generating your image... (${elapsedSec}s)`}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Controls */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-5">
            {/* Output Mode */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Output Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("image")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                    mode === "image"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("video");
                    if (ratioId === "1:1") setRatioId("16:9");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                    mode === "video"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  Video
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Prompt
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === "video"
                    ? "Aerial drone shot over glowing neon Tokyo streets in rain..."
                    : "A futuristic neon cyberpunk city reflected in rain puddles at night..."
                }
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-3 text-sm outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Style
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      style === s.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "video" && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Camera Motion
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {MOTIONS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMotion(m.id)}
                        className={`rounded-lg border py-2 font-medium transition-colors ${
                          motion === m.id
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {([3, 5] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDurationSec(sec)}
                        className={`rounded-lg border py-2 font-medium transition-colors ${
                          durationSec === sec
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {sec} Seconds
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRatioId(r.id)}
                    className={`rounded-lg border py-2 font-medium ${
                      ratioId === r.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => runGeneration()}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : mode === "video" ? (
                <>
                  <Film className="h-4 w-4" />
                  Generate Video
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Image
                </>
              )}
            </button>

            {mediaUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download {generatedKind === "video" ? "Video" : "Image"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
