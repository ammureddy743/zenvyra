import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Eraser,
  Layers,
  Lock,
  Maximize2,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  UserSquare2,
  Wand2,
  Zap,
} from "lucide-react";
import { LiveStudioWorkspace } from "@/components/LiveStudioWorkspace";
import { PromptCommandBar } from "@/components/PromptCommandBar";
import { HeroShowcase } from "@/components/HeroShowcase";
import { PricingSection } from "@/components/PricingSection";
import { FaqAccordion } from "@/components/FaqAccordion";

const METRICS = [
  {
    label: "Export Quality",
    value: "Full-Res",
    detail: "Lossless PNG & 96% JPEG up to 20 MB",
    icon: Layers,
  },
  {
    label: "AI Engines",
    value: "6 Studios",
    detail: "BiRefNet, IS-Net, Inpaint, Upscale & Gen",
    icon: Zap,
  },
  {
    label: "Data Retention",
    value: "24h Purge",
    detail: "Automatic deletion with zero training",
    icon: Lock,
  },
  {
    label: "Precision Control",
    value: "Pixel Brush",
    detail: "Manual erase, restore & edge feathering",
    icon: SlidersHorizontal,
  },
];

const TOOLS = [
  {
    id: "background-remover",
    name: "Background Remover",
    tag: "Cutout",
    desc: "Isolate subjects at full resolution with BiRefNet & IS-Net, edge feathering, and a manual touch-up brush.",
    href: "/tools/background-remover",
    icon: Scissors,
  },
  {
    id: "upscaler",
    name: "Image Upscaler",
    tag: "4× AI",
    desc: "Upscale 2× or 4× while preserving crisp edges, fine textures, and natural detail with adaptive denoising.",
    href: "/tools/upscaler",
    icon: Maximize2,
  },
  {
    id: "object-remover",
    name: "Object Remover",
    tag: "Inpaint",
    desc: "Paint over unwanted people, watermarks, cables, or blemishes and reconstruct the scene cleanly.",
    href: "/tools/object-remover",
    icon: Eraser,
  },
  {
    id: "photo-restorer",
    name: "Old Photo Restorer",
    tag: "Restore",
    desc: "Recover faded contrast, reduce film grain, sharpen facial details, and colorize monochrome portraits.",
    href: "/tools/photo-restorer",
    icon: Wand2,
  },
  {
    id: "passport-maker",
    name: "Passport Photo Maker",
    tag: "ID & Visa",
    desc: "Auto-crop to US, EU, UK, and India specifications with compliant backgrounds and 4×6 print sheets.",
    href: "/tools/passport-maker",
    icon: UserSquare2,
  },
  {
    id: "image-generator",
    name: "AI Image Generator",
    tag: "Text-to-Image",
    desc: "Generate studio-grade artwork, product concepts, and photorealistic scenes from any text prompt.",
    href: "/tools/image-generator",
    icon: Sparkles,
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Upload or describe your edit",
    desc: "Drop any JPG, PNG, or WebP up to 20 MB, or type a natural-language command in the prompt bar to jump straight to the right tool.",
    icon: UploadCloud,
  },
  {
    step: "02",
    title: "Refine with AI & pixel tools",
    desc: "Run BiRefNet, 4× upscaling, or inpainting—then inspect with the zoomable Before/After slider and touch-up brush.",
    icon: SlidersHorizontal,
  },
  {
    step: "03",
    title: "Export at native resolution",
    desc: "Download lossless transparent PNGs or high-quality JPEGs with zero compression. Temporary files auto-purge within 24 hours.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16 sm:pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200/70 dark:border-zinc-800/70 bg-studio-grid pt-10 pb-14 sm:pt-20 sm:pb-20">
        {/* Ambient Studio Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[780px] rounded-full bg-gradient-to-tr from-violet-600/15 via-fuchsia-500/10 to-cyan-500/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:gap-14 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 dark:border-violet-900/60 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 shadow-sm backdrop-blur-sm mb-5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span>Full-Resolution AI Photo Studio</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.08] text-zinc-900 dark:text-white">
                Studio-grade{" "}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                  AI photo editing
                </span>{" "}
                in your browser.
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl">
                Remove backgrounds with BiRefNet, upscale 4×, erase unwanted
                objects, restore vintage portraits, and create compliant IDs—at
                full native resolution.
              </p>

              <div className="mt-7">
                <PromptCommandBar />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#studio"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-opacity"
                >
                  Open Live Studio
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#tools"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-5 py-3 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Explore All 6 Tools
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Auto-deleted after 24h
                </span>
                <span aria-hidden="true">•</span>
                <span>10 free daily credits</span>
                <span aria-hidden="true">•</span>
                <span>Zero compression</span>
              </div>
            </div>

            {/* Interactive Studio Preview */}
            <div className="lg:col-span-6">
              <HeroShowcase />
            </div>
          </div>

          {/* Capabilities Strip */}
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="flex items-start gap-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {m.label}
                    </div>
                    <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {m.value}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {m.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Inline Multi-Tool Live Studio */}
      <section id="studio" className="scroll-mt-20">
        <LiveStudioWorkspace />
      </section>

      {/* Tool Cards */}
      <section id="tools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              AI Suite
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
              One workspace, six specialized studios
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Purpose-built AI models engineered for commercial cutouts, restoration, and print-ready output.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/80 dark:hover:border-violet-700 hover:shadow-xl hover:shadow-violet-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
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
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-violet-600 dark:text-violet-400">
                  <span>Launch studio</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 p-6 sm:p-10">
          <div className="mb-8 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Workflow
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
              From raw photo to production asset in seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {WORKFLOW_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-zinc-400">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              FAQ
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Everything you need to know about resolution, privacy, AI models, and credits.
            </p>
          </div>
          <div className="lg:col-span-8">
            <FaqAccordion />
          </div>
        </div>
      </section>
    </div>
  );
}
