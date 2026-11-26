"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

const QUICK_PROMPTS = [
  "Generate: Neon cyberpunk city at night",
  "Video: Ocean waves at golden sunset",
  "Edit photo: crop and adjust colors",
  "Edit video: trim and crop for Reels",
  "Remove background",
  "Upscale 4x sharper",
  "Remove unwanted object",
  "Restore & colorize old photo",
  "US passport photo white background",
];

function resolvePromptRoute(promptText: string): string {
  const raw = promptText.trim();
  const q = raw.toLowerCase();

  if (
    q.startsWith("edit video") ||
    q.includes("trim video") ||
    q.includes("crop video") ||
    q.includes("edit my video")
  ) {
    return "/tools/video-editor";
  }

  if (
    q.startsWith("edit photo") ||
    q.startsWith("photo editor") ||
    q.includes("crop photo") ||
    q.includes("rotate photo") ||
    q.includes("adjust photo")
  ) {
    return "/tools/photo-editor";
  }

  if (
    q.startsWith("video:") ||
    q.startsWith("animate:") ||
    q.includes(" video") ||
    q.startsWith("video ") ||
    q.includes("animate ") ||
    q.includes("animation") ||
    q.includes("motion clip")
  ) {
    const cleaned = raw
      .replace(/^(video:|animate:|create a video of|generate a video of|make a video of)\s*/i, "")
      .trim();
    return `/tools/image-generator?mode=video&prompt=${encodeURIComponent(cleaned || raw)}`;
  }

  if (q.startsWith("generate:") || q.startsWith("create:") || q.startsWith("draw ")) {
    const cleaned = raw.replace(/^(generate:|create:|draw\s+)/i, "").trim();
    return `/tools/image-generator?mode=image&prompt=${encodeURIComponent(cleaned)}`;
  }

  if (q.includes("passport") || q.includes("visa") || q.includes("id photo")) {
    const params = new URLSearchParams();
    if (q.includes("eu") || q.includes("europe") || q.includes("35x45")) {
      params.set("preset", "eu-35x45");
    } else if (q.includes("uk")) {
      params.set("preset", "uk-35x45");
    } else if (q.includes("india")) {
      params.set("preset", "india-35x45");
    } else {
      params.set("preset", "us-2x2");
    }
    if (q.includes("blue")) params.set("bg", "#dbeafe");
    else if (q.includes("gray") || q.includes("grey")) params.set("bg", "#e4e4e7");
    else params.set("bg", "#ffffff");
    if (q.includes("sheet") || q.includes("print")) params.set("sheet", "1");
    return `/tools/passport-maker?${params.toString()}`;
  }

  if (q.includes("upscale") || q.includes("4x") || q.includes("2x") || q.includes("sharpen") || q.includes("resolution")) {
    const scale = q.includes("4x") ? "4" : "2";
    return `/tools/upscaler?scale=${scale}`;
  }

  if (q.includes("remove object") || q.includes("erase") || q.includes("inpaint") || q.includes("blemish")) {
    return "/tools/object-remover";
  }

  if (q.includes("restore") || q.includes("old photo") || q.includes("colorize") || q.includes("vintage")) {
    const colorize = q.includes("color") ? "1" : "0";
    return `/tools/photo-restorer?colorize=${colorize}`;
  }

  if (q.includes("background") || q.includes("remove bg") || q.includes("cutout")) {
    return "/tools/background-remover";
  }

  // Any other descriptive prompt generates a brand-new AI image
  return `/tools/image-generator?mode=image&prompt=${encodeURIComponent(raw)}`;
}

export function PromptCommandBar() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = resolvePromptRoute(prompt.trim() || "Neon cyberpunk city at night");
    router.push(target);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-sm focus-within:border-violet-500 transition-colors"
      >
        <div className="flex flex-1 items-center gap-2.5 px-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Generate media, edit a photo, trim a video, or pick an AI tool..."
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 transition-opacity"
        >
          Run Prompt
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mr-1">
          Try:
        </span>
        {QUICK_PROMPTS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => router.push(resolvePromptRoute(chip))}
            className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
