import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eraser,
  Maximize2,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserSquare2,
  Wand2,
} from "lucide-react";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PromptCommandBar } from "@/components/PromptCommandBar";

const DEMO_BEFORE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#9333ea"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#sky)"/>
    <circle cx="650" cy="120" r="65" fill="#fde047" opacity="0.9"/>
    <path d="M0 440 Q220 350 420 430 T800 410 L800 600 L0 600 Z" fill="#1e1b4b" opacity="0.65"/>
    <rect x="275" y="160" width="250" height="290" rx="36" fill="#ffffff"/>
    <circle cx="400" cy="260" r="56" fill="#7c3aed"/>
    <rect x="330" y="335" width="140" height="80" rx="22" fill="#06b6d4"/>
  </svg>
`);

const DEMO_AFTER_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <rect x="275" y="160" width="250" height="290" rx="36" fill="#ffffff"/>
    <circle cx="400" cy="260" r="56" fill="#7c3aed"/>
    <rect x="330" y="335" width="140" height="80" rx="22" fill="#06b6d4"/>
  </svg>
`);

const TOOLS = [
  {
    id: "background-remover",
    name: "Background Remover",
    desc: "Clean full-resolution cutouts with BiRefNet & IS-Net, edge refinement, and touch-up brush.",
    href: "/tools/background-remover",
    status: "Active",
    icon: Scissors,
  },
  {
    id: "upscaler",
    name: "Image Upscaler",
    desc: "Enhance sharpness and upscale 2x–4x with detail preservation and denoising.",
    href: "/tools/upscaler",
    status: "Active",
    icon: Maximize2,
  },
  {
    id: "object-remover",
    name: "Object Remover",
    desc: "Paint over unwanted people, text, or blemishes with AI inpainting.",
    href: "/tools/object-remover",
    status: "Active",
    icon: Eraser,
  },
  {
    id: "photo-restorer",
    name: "Old Photo Restorer",
    desc: "Restore faded contrast, reduce grain, sharpen faces, and colorize vintage photos.",
    href: "/tools/photo-restorer",
    status: "Active",
    icon: Wand2,
  },
  {
    id: "passport-maker",
    name: "Passport Photo Maker",
    desc: "Auto-crop to official dimensions with compliant solid backgrounds & 4x6 sheets.",
    href: "/tools/passport-maker",
    status: "Active",
    icon: UserSquare2,
  },
];

const FAQS = [
  {
    q: "Does Zenvyra compress my uploaded photos?",
    a: "No. Your original photo is never compressed or overwritten, and exports run at full resolution in lossless PNG or 96% quality JPEG.",
  },
  {
    q: "How long are my uploaded files stored?",
    a: "All temporary uploaded and processed files are automatically deleted within 24 hours for privacy.",
  },
  {
    q: "Which AI model should I choose for background removal?",
    a: "Use BiRefNet General for portraits, hair, fur, and complex edges. Use IS-Net General Use for faster product and crisp geometric cutouts.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/40 px-3.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Zenvyra AI Photo Studio • Full Resolution
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
                Studio-grade{" "}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                  AI photo editing
                </span>{" "}
                in your browser.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
                Upload any JPG, PNG, or WebP up to 20 MB. Remove backgrounds with
                BiRefNet, refine edges, touch up with a brush, and export at full
                resolution.
              </p>

              <div className="mt-7">
                <PromptCommandBar />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/tools/background-remover"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-opacity"
                >
                  Try Background Remover
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#tools"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-5 py-3.5 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  Explore Tools
                </a>
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Auto-deleted after 24h
                </span>
                <span>•</span>
                <span>10 free daily credits</span>
                <span>•</span>
                <span>No compression</span>
              </div>
            </div>

            {/* Live Demo Slider */}
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl">
              <BeforeAfterSlider
                beforeSrc={DEMO_BEFORE_SVG}
                afterSrc={DEMO_AFTER_SVG}
                beforeLabel="Original"
                afterLabel="Cutout"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tool Cards */}
      <section id="tools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            One workspace, five AI tools
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Built step-by-step for speed, full-resolution quality, and clean UX.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = tool.status === "Active";
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className={`group rounded-2xl border p-6 transition-all ${
                  isActive
                    ? "border-violet-300 dark:border-violet-800 bg-white dark:bg-zinc-900 hover:shadow-lg"
                    : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {tool.status}
                  </span>
                </div>
                <h3 className="text-base font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {tool.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Start editing immediately with daily free credits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7">
            <h3 className="text-lg font-semibold">Free Starter</h3>
            <div className="mt-2 text-3xl font-bold">
              $0 <span className="text-sm font-normal text-zinc-500">/ day</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                10 free AI edits every day
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Full-resolution PNG &amp; 96% JPEG export
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Touch-up brush &amp; edge refinement
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-violet-500/60 bg-gradient-to-br from-violet-600/10 via-fuchsia-500/5 to-cyan-500/10 p-7">
            <h3 className="text-lg font-semibold">Pro Studio</h3>
            <div className="mt-2 text-3xl font-bold">
              $12 <span className="text-sm font-normal text-zinc-500">/ month</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500" />
                Unlimited daily AI edits across all 5 tools
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500" />
                Priority GPU inference queue
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500" />
                24-hour encrypted cloud history
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          Frequently asked questions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FAQS.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
            >
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-4">
        <span>Zenvyra AI Photo Platform</span>
        <span>Uploaded files are automatically purged after 24 hours.</span>
      </footer>
    </div>
  );
}
