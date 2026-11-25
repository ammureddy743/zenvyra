"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

const QUICK_PROMPTS = [
  "Remove background",
  "Upscale 4x sharper",
  "Remove unwanted object",
  "Restore & colorize old photo",
  "US passport photo white background",
];

function resolvePromptRoute(promptText: string): string {
  const q = promptText.toLowerCase();

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

  if (q.includes("object") || q.includes("erase") || q.includes("inpaint") || q.includes("blemish") || q.includes("person")) {
    return "/tools/object-remover";
  }

  if (q.includes("restore") || q.includes("old") || q.includes("colorize") || q.includes("vintage") || q.includes("face")) {
    const colorize = q.includes("color") ? "1" : "0";
    return `/tools/photo-restorer?colorize=${colorize}`;
  }

  return "/tools/background-remover";
}

export function PromptCommandBar() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = resolvePromptRoute(prompt.trim() || "remove background");
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
            placeholder="Describe your edit (e.g. 'Upscale 4x' or 'US passport photo white background')..."
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
