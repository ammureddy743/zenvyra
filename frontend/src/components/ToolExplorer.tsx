"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Eraser,
  Film,
  ImageIcon,
  Maximize2,
  Scissors,
  Search,
  Sparkles,
  UserSquare2,
  Wand2,
} from "lucide-react";

const TOOLS = [
  {
    id: "background-remover",
    name: "Background Remover",
    category: "Edit",
    tag: "Cutout",
    desc: "Isolate subjects with refined edges, a transparent export, and a manual touch-up brush.",
    href: "/tools/background-remover",
    icon: Scissors,
  },
  {
    id: "upscaler",
    name: "Image Upscaler",
    category: "Edit",
    tag: "2x / 4x",
    desc: "Increase image size while preserving crisp edges, fine textures, and natural detail.",
    href: "/tools/upscaler",
    icon: Maximize2,
  },
  {
    id: "object-remover",
    name: "Object Remover",
    category: "Edit",
    tag: "Inpaint",
    desc: "Paint over unwanted objects and reconstruct the scene around them.",
    href: "/tools/object-remover",
    icon: Eraser,
  },
  {
    id: "photo-restorer",
    name: "Old Photo Restorer",
    category: "Restore",
    tag: "Restore",
    desc: "Refresh faded photos, reduce grain, sharpen details, and colorize portraits.",
    href: "/tools/photo-restorer",
    icon: Wand2,
  },
  {
    id: "passport-maker",
    name: "Passport Photo Maker",
    category: "Create",
    tag: "ID & Visa",
    desc: "Crop to US, EU, UK, or India specifications and create print-ready sheets.",
    href: "/tools/passport-maker",
    icon: UserSquare2,
  },
  {
    id: "image-generator",
    name: "AI Image & Video Generator",
    category: "Create",
    tag: "Text-to-Media",
    desc: "Turn a text prompt into a new image or animated motion video.",
    href: "/tools/image-generator",
    icon: Sparkles,
  },
  {
    id: "photo-editor",
    name: "Photo Editor",
    category: "Edit",
    tag: "Crop & Color",
    desc: "Crop, rotate, adjust light and color, add a caption, and export your photo.",
    href: "/tools/photo-editor",
    icon: ImageIcon,
  },
  {
    id: "video-editor",
    name: "Video Editor",
    category: "Edit",
    tag: "Trim & Crop",
    desc: "Trim a clip, crop it to common aspect ratios, and export for sharing.",
    href: "/tools/video-editor",
    icon: Film,
  },
];

const CATEGORIES = ["All tools", "Edit", "Create", "Restore"];

export function ToolExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const matchesCategory = category === "All tools" || tool.category === category;
      const matchesQuery = !normalizedQuery ||
        `${tool.name} ${tool.category} ${tool.tag} ${tool.desc}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-3 focus-within:border-violet-500 sm:max-w-sm">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a tool..."
            aria-label="Search photo tools"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Filter tools by type">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${category === item
                ? "bg-violet-600 text-white"
                : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-violet-400"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
        Showing {filteredTools.length} of {TOOLS.length} tools
      </p>
      {filteredTools.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/80 dark:hover:border-violet-700 hover:shadow-xl hover:shadow-violet-500/5"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 text-violet-600 dark:text-violet-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      {tool.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{tool.desc}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-4 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  <span>Launch studio</span>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-12 text-center">
          <p className="font-semibold">No tools found</p>
          <p className="mt-1 text-sm text-zinc-500">Try another search or choose a different category.</p>
          <button
            type="button"
            onClick={() => { setQuery(""); setCategory("All tools"); }}
            className="mt-4 text-sm font-semibold text-violet-600 hover:text-violet-500"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
