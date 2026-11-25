"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useCredits } from "./CreditsContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const STYLES = [
  { id: "photorealistic", label: "Photorealistic" },
  { id: "digital-art", label: "Digital Art" },
  { id: "anime", label: "Anime" },
  { id: "3d-render", label: "3D Render" },
  { id: "minimalist", label: "Minimalist" },
];

const RATIOS = [
  { id: "1:1", label: "1:1 Square", w: 1024, h: 1024 },
  { id: "16:9", label: "16:9 Landscape", w: 1280, h: 720 },
  { id: "9:16", label: "9:16 Portrait", w: 720, h: 1280 },
];

export function ImageGeneratorStudio() {
  const searchParams = useSearchParams();
  const { credits, consumeCredit } = useCredits();
  const autoRanRef = useRef(false);

  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [style, setStyle] = useState("photorealistic");
  const [ratioId, setRatioId] = useState("1:1");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
    async (textToGenerate?: string) => {
      const finalPrompt = (textToGenerate ?? prompt).trim();
      if (finalPrompt.length < 2) {
        setErrorMsg("Please enter a prompt describing the image you want to create.");
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
        formData.append("width", String(ratio.w));
        formData.append("height", String(ratio.h));

        const res = await fetch(`${API_BASE}/api/v1/generate-image`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || "Image generation failed.");
        }

        const ms = res.headers.get("X-Processing-Ms");
        if (ms) setProcessingMs(Number(ms));

        const blob = await res.blob();
        setImageUrl(URL.createObjectURL(blob));
        consumeCredit();
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to generate image."
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, style, ratioId, credits, consumeCredit]
  );

  useEffect(() => {
    const initialPrompt = searchParams.get("prompt");
    if (initialPrompt && !autoRanRef.current) {
      autoRanRef.current = true;
      setPrompt(initialPrompt);
      runGeneration(initialPrompt);
    }
  }, [searchParams, runGeneration]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "zenvyra-generated.jpg";
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          AI Image Generator
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Create Images from Text Prompts
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Describe anything you imagine and generate high-resolution AI artwork in seconds.
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
          {processingMs !== null && imageUrl && (
            <div className="flex items-center justify-end gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Generated in {(processingMs / 1000).toFixed(2)}s
            </div>
          )}

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={prompt || "Generated AI image"}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center p-8 text-zinc-500 dark:text-zinc-400">
                <Wand2 className="h-10 w-10 mx-auto mb-3 text-violet-500 opacity-70" />
                <p className="text-sm font-medium">
                  Enter a prompt on the right and click Generate Image
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white p-6 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-violet-400 mb-3" />
                <p className="text-sm font-semibold">
                  Generating your image... ({elapsedSec}s)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Prompt
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic neon cyberpunk city reflected in rain puddles at night..."
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Image
                </>
              )}
            </button>

            {imageUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900"
              >
                <Download className="h-4 w-4" />
                Download Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
