"use client";

import { Suspense, useState } from "react";
import {
  ArrowUpRight,
  Eraser,
  Film,
  ImageIcon,
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
import { PhotoEditorStudio } from "./PhotoEditorStudio";
import { VideoEditorStudio } from "./VideoEditorStudio";

type StudioId =
  | "background-remover"
  | "upscaler"
  | "object-remover"
  | "photo-restorer"
  | "passport-maker"
  | "image-generator"
  | "photo-editor"
  | "video-editor";

const STUDIO_TABS: { id: StudioId; label: string; detail: string; icon: typeof Scissors }[] = [
  { id: "background-remover", label: "Background", detail: "Cut out a subject", icon: Scissors },
  { id: "upscaler", label: "Upscale", detail: "Add image detail", icon: Maximize2 },
  { id: "object-remover", label: "Object removal", detail: "Erase distractions", icon: Eraser },
  { id: "photo-restorer", label: "Photo restore", detail: "Repair old photos", icon: Wand2 },
  { id: "passport-maker", label: "ID photos", detail: "Crop for print", icon: UserSquare2 },
  { id: "image-generator", label: "Generate", detail: "Create image or video", icon: Sparkles },
  { id: "photo-editor", label: "Photo edit", detail: "Crop, color, caption", icon: ImageIcon },
  { id: "video-editor", label: "Video edit", detail: "Trim and crop clips", icon: Film },
];

export function LiveStudioWorkspace() {
  const [activeStudio, setActiveStudio] =
    useState<StudioId>("background-remover");
  const activeTab = STUDIO_TABS.find((tab) => tab.id === activeStudio) ?? STUDIO_TABS[0];
  const ActiveIcon = activeTab.icon;
  const uploadHint = activeStudio === "video-editor"
    ? "MP4, WebM, or MOV · up to 250 MB"
    : activeStudio === "photo-editor"
      ? "JPG, PNG, or WebP · up to 30 MB"
      : activeStudio === "image-generator"
        ? "Describe the image or video you want to create"
        : "JPG, PNG, or WebP · up to 20 MB";

  return (
    <section aria-labelledby="workspace-title" className="space-y-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-950/[0.04] dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-black/20">
          <div className="flex flex-col gap-5 bg-gradient-to-br from-violet-50 via-white to-cyan-50/70 p-5 dark:from-violet-950/30 dark:via-zinc-900 dark:to-cyan-950/20 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Zenvyra workspace
                </span>
                <h2 id="workspace-title" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                  What would you like to make?
                </h2>
                <p className="mt-1.5 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                  Choose a focused studio, bring in a photo or video, and make the edit your own.
                </p>
              </div>
              <a href="#tools" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition hover:text-violet-500 dark:text-violet-300">
                View all tools <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div role="group" aria-label="Choose a studio" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
              {STUDIO_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeStudio === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveStudio(tab.id)}
                    className={`group flex min-h-[76px] items-center gap-2.5 rounded-2xl border p-3 text-left transition duration-200 ${isActive
                      ? "border-violet-500 bg-zinc-950 text-white shadow-lg shadow-violet-950/15 dark:bg-white dark:text-zinc-950"
                      : "border-zinc-200/80 bg-white/75 text-zinc-800 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-violet-500/50 dark:hover:bg-zinc-950"
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-violet-500 text-white dark:bg-violet-600" : "bg-violet-500/10 text-violet-700 dark:text-violet-300"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">{tab.label}</span>
                      <span className={`mt-0.5 block truncate text-[10px] ${isActive ? "text-zinc-300 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}`}>{tab.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3 dark:border-white/10 sm:px-7">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              <ActiveIcon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
              {activeTab.label} studio
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{uploadHint}</span>
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
        {activeStudio === "photo-editor" && <PhotoEditorStudio />}
        {activeStudio === "video-editor" && <VideoEditorStudio />}
      </Suspense>
    </section>
  );
}
