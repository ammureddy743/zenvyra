"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Does Zenvyra compress my uploaded photos?",
    a: "Never. Your original image is processed in memory without lossy downscaling, and you can export at full native resolution in lossless PNG or 96% quality JPEG.",
  },
  {
    q: "How long are my uploaded and processed files stored?",
    a: "Zenvyra operates on a strict zero-retention policy. Temporary uploaded and processed files are automatically purged within 24 hours.",
  },
  {
    q: "Which AI model should I choose for background removal?",
    a: "Use BiRefNet General for portraits, hair, fur, and intricate edges. Choose IS-Net General Use for e-commerce products, vehicles, and crisp geometric silhouettes, or U2NetP for instant previews.",
  },
  {
    q: "Can I refine edges or fix small details after AI removal?",
    a: "Yes. Every cutout opens with Edge Feathering, Smoothing, and Shift Edge controls, plus a full-resolution Touch-Up Brush with Erase, Restore, and Undo/Redo history.",
  },
  {
    q: "Are passport photos compliant with official standards?",
    a: "Yes. The Passport Photo Maker includes presets for US (2×2 in), EU/Schengen, UK, and India (35×45 mm) with compliant background colors and optional 4×6 printable sheets.",
  },
  {
    q: "How do daily free credits work?",
    a: "Every visitor receives 10 free AI credits per day across all 6 tools. Sign in to sync your account and unlock Pro Studio tiers when you need unlimited volume.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70">
      {FAQS.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
            >
              <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {item.q}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-violet-500" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 sm:px-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
