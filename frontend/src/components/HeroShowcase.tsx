"use client";

import { useState } from "react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

const STUDIO_PRODUCT_SVG = (withBg: boolean) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="studioWall" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="50%" stop-color="#312e81"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <radialGradient id="spot" cx="50%" cy="38%" r="48%">
        <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="tableGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="cupMetal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#18181b"/>
        <stop offset="35%" stop-color="#3f3f46"/>
        <stop offset="70%" stop-color="#27272a"/>
        <stop offset="100%" stop-color="#09090b"/>
      </linearGradient>
      <linearGradient id="lensGlass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#06b6d4"/>
        <stop offset="45%" stop-color="#7c3aed"/>
        <stop offset="100%" stop-color="#09090b"/>
      </linearGradient>
      <linearGradient id="ringAccent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#c084fc"/>
        <stop offset="100%" stop-color="#22d3ee"/>
      </linearGradient>
    </defs>
    ${
      withBg
        ? `<rect width="800" height="600" fill="url(#studioWall)"/>
           <rect width="800" height="600" fill="url(#spot)"/>
           <path d="M0 430 L800 430 L800 600 L0 600 Z" fill="url(#tableGrad)"/>
           <ellipse cx="400" cy="442" rx="210" ry="26" fill="#020617" opacity="0.65"/>`
        : ""
    }
    <!-- Camera Body -->
    <g>
      <rect x="210" y="195" width="380" height="235" rx="28" fill="url(#cupMetal)" stroke="#52525b" stroke-width="2"/>
      <!-- Top Prism / Viewfinder -->
      <path d="M315 195 L345 142 Q355 130 370 130 L430 130 Q445 130 455 142 L485 195 Z" fill="url(#cupMetal)" stroke="#52525b" stroke-width="2"/>
      <rect x="372" y="144" width="56" height="14" rx="4" fill="#18181b" stroke="#3f3f46"/>
      <!-- Shutter Dial & Button -->
      <rect x="248" y="176" width="44" height="19" rx="5" fill="#27272a" stroke="#71717a"/>
      <rect x="505" y="172" width="38" height="23" rx="6" fill="#27272a" stroke="#71717a"/>
      <circle cx="268" cy="235" r="10" fill="#ef4444" opacity="0.85"/>
      <!-- Grip Texture -->
      <rect x="220" y="215" width="68" height="195" rx="18" fill="#18181b" opacity="0.7"/>
      <!-- Lens Barrel -->
      <circle cx="410" cy="312" r="108" fill="#09090b" stroke="#52525b" stroke-width="4"/>
      <circle cx="410" cy="312" r="96" fill="none" stroke="url(#ringAccent)" stroke-width="3" opacity="0.85"/>
      <circle cx="410" cy="312" r="82" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
      <circle cx="410" cy="312" r="64" fill="url(#lensGlass)"/>
      <circle cx="410" cy="312" r="36" fill="#020617" opacity="0.75"/>
      <!-- Glass Reflections -->
      <ellipse cx="386" cy="286" rx="22" ry="12" transform="rotate(-28 386 286)" fill="#ffffff" opacity="0.32"/>
      <circle cx="436" cy="336" r="8" fill="#22d3ee" opacity="0.45"/>
      <circle cx="446" cy="348" r="4" fill="#e879f9" opacity="0.5"/>
    </g>
  </svg>
`);

const STUDIO_WATCH_SVG = (withBg: boolean) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <radialGradient id="glow2" cx="50%" cy="48%" r="45%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e4e4e7"/>
        <stop offset="50%" stop-color="#71717a"/>
        <stop offset="100%" stop-color="#27272a"/>
      </linearGradient>
      <linearGradient id="dial" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#09090b"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
    </defs>
    ${
      withBg
        ? `<rect width="800" height="600" fill="url(#bg2)"/>
           <rect width="800" height="600" fill="url(#glow2)"/>
           <ellipse cx="400" cy="485" rx="140" ry="22" fill="#020617" opacity="0.6"/>`
        : ""
    }
    <g>
      <!-- Strap -->
      <rect x="342" y="85" width="116" height="125" rx="16" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
      <rect x="342" y="390" width="116" height="125" rx="16" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
      <!-- Crown -->
      <rect x="518" y="282" width="18" height="36" rx="5" fill="url(#steel)"/>
      <!-- Case -->
      <circle cx="400" cy="300" r="124" fill="url(#steel)"/>
      <circle cx="400" cy="300" r="110" fill="#18181b"/>
      <circle cx="400" cy="300" r="98" fill="url(#dial)" stroke="#3f3f46" stroke-width="2"/>
      <!-- Indices -->
      <rect x="397" y="212" width="6" height="18" rx="2" fill="#e4e4e7"/>
      <rect x="397" y="370" width="6" height="18" rx="2" fill="#e4e4e7"/>
      <rect x="312" y="297" width="18" height="6" rx="2" fill="#e4e4e7"/>
      <rect x="470" y="297" width="18" height="6" rx="2" fill="#e4e4e7"/>
      <!-- Hands -->
      <line x1="400" y1="300" x2="400" y2="236" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
      <line x1="400" y1="300" x2="452" y2="328" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="400" cy="300" r="8" fill="#a855f7"/>
    </g>
  </svg>
`);

const DEMOS = [
  {
    id: "camera",
    label: "Product Cutout",
    before: STUDIO_PRODUCT_SVG(true),
    after: STUDIO_PRODUCT_SVG(false),
    beforeLabel: "Studio Shot",
    afterLabel: "Transparent PNG",
  },
  {
    id: "watch",
    label: "E-Commerce",
    before: STUDIO_WATCH_SVG(true),
    after: STUDIO_WATCH_SVG(false),
    beforeLabel: "Original",
    afterLabel: "Isolated",
  },
];

export function HeroShowcase() {
  const [activeId, setActiveId] = useState("camera");
  const current = DEMOS.find((d) => d.id === activeId) || DEMOS[0];

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-3 sm:p-4 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Zenvyra Studio Preview
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950 p-0.5 text-[11px] font-medium">
          {DEMOS.map((demo) => (
            <button
              key={demo.id}
              type="button"
              onClick={() => setActiveId(demo.id)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                activeId === demo.id
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      <BeforeAfterSlider
        beforeSrc={current.before}
        afterSrc={current.after}
        beforeLabel={current.beforeLabel}
        afterLabel={current.afterLabel}
      />
    </div>
  );
}
