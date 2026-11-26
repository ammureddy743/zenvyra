"use client";

import { Suspense, useState } from "react";
import {
  Eraser,
  Maximize2,
  Scissors,
  Sparkles,
  UserSquare2,
  Wand2,
} from "lucide-react";
import { BackgroundRemoverStudio } from "./BackgroundRemoverStudio";
import { UpscalerStudio } from "./UpscalerStudio";
import { ObjectRemoverStudio } from "./ObjectRemoverStudio";
import { PhotoRestorerStudio } from "./PhotoRestorerStudio";
import { PassportMakerStudio } from "./PassportMakerStudio";
import { ImageGeneratorStudio } from "./ImageGeneratorStudio";

type StudioId =
  | "background-remover"
  | "upscaler"
  | "object-remover"
  | "photo-restorer"
  | "passport-maker"
  | "image-generator";

const STUDIO_TABS: { id: StudioId; label: string; icon: typeof Scissors }[] = [
  { id: "background-remover", label: "Bg Remover", icon: Scissors },
  { id: "upscaler", label: "Upscaler", icon: Maximize2 },
  { id: "object-remover", label: "Object Remover", icon: Eraser },
  { id: "photo-restorer", label: "Photo Restorer", icon: Wand2 },
  { id: "passport-maker", label: "Passport Maker", icon: UserSquare2 },
  { id: "image-generator", label: "Image & Video", icon: Sparkles },
];

export function LiveStudioWorkspace() {
  const [activeStudio, setActiveStudio] =
    useState<StudioId>("background-remover");

  return (
    <div className="space-y-4">
      {/* Studio Switcher Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 p-3 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Interactive Live Studio
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Switch between all 6 AI tools in one workspace
              </h2>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Select AI studio tool"
            className="flex flex-wrap gap-1.5"
          >
            {STUDIO_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStudio === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveStudio(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 text-white shadow-sm"
                      : "border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-300 hover:border-violet-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Studio */}
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-sm text-zinc-500">
            Loading studio...
          </div>
        }
      >
        {activeStudio === "background-remover" && <BackgroundRemoverStudio />}
        {activeStudio === "upscaler" && <UpscalerStudio />}
        {activeStudio === "object-remover" && <ObjectRemoverStudio />}
        {activeStudio === "photo-restorer" && <PhotoRestorerStudio />}
        {activeStudio === "passport-maker" && <PassportMakerStudio />}
        {activeStudio === "image-generator" && <ImageGeneratorStudio />}
      </Suspense>
    </div>
  );
}
