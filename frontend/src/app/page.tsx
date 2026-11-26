import {
  ArrowRight,
  Layers,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";
import { LiveStudioWorkspace } from "@/components/LiveStudioWorkspace";
import { PromptCommandBar } from "@/components/PromptCommandBar";
import { HeroShowcase } from "@/components/HeroShowcase";
import { PricingSection } from "@/components/PricingSection";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ToolExplorer } from "@/components/ToolExplorer";
import { ProductFeatures } from "@/components/ProductFeatures";

const METRICS = [
  {
    label: "Export Quality",
    value: "Full-Res",
    detail: "Full-size PNG and high-quality JPEG photo exports",
    icon: Layers,
  },
  {
    label: "Creative Tools",
    value: "8 Studios",
    detail: "Photo editing, AI creation, and video",
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

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Upload or describe your edit",
    desc: "Upload a supported photo or video clip, or type an edit in the prompt bar to open the right studio.",
    icon: UploadCloud,
  },
  {
    step: "02",
    title: "Refine with AI & pixel tools",
    desc: "Remove a background or object, adjust a photo, trim a clip, or upscale—then compare and refine your result.",
    icon: SlidersHorizontal,
  },
  {
    step: "03",
    title: "Export at native resolution",
    desc: "Export photos as PNG or JPEG and videos as MP4 when supported, otherwise WebM. Temporary server uploads auto-purge within 24 hours.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16 sm:pb-24">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#09080d] pb-12 pt-14 text-white sm:pb-16 sm:pt-20 lg:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-72 left-1/2 h-[620px] w-[1000px] -translate-x-1/2 rounded-full bg-violet-700/25 blur-[130px]" />
          <div className="absolute right-[-12%] top-1/3 h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-zinc-950/80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-zinc-200 shadow-lg shadow-black/10 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
              Your creative studio, powered by AI
            </div>
            <h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[5.25rem]">
              Make every image
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">more than it was.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              Edit photos, trim videos, restore old images, and create with AI in one clear workspace. Start with a prompt or choose a studio.
            </p>
            <div className="mx-auto mt-8 max-w-3xl text-left">
              <PromptCommandBar />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="#studio" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
                Start creating <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#tools" className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10">
                Explore the tools
              </a>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              10 free daily credits <span className="text-zinc-600">·</span> Auto-deleted after 24 hours <span className="text-zinc-600">·</span> Full-resolution exports
            </div>
          </div>

          <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
            <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-cyan-500/20 blur-2xl" />
            <div className="relative rounded-2xl border border-white/15 bg-zinc-900/80 p-2 shadow-[0_40px_120px_-40px_rgba(139,92,246,0.45)] sm:rounded-3xl sm:p-3">
              <HeroShowcase />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              A closer look at the Zenvyra workspace
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm sm:p-5">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    <Icon className="h-4 w-4 text-violet-300" /> {m.label}
                  </div>
                  <div className="mt-3 text-lg font-semibold tracking-tight text-white sm:text-xl">{m.value}</div>
                  <div className="mt-1 text-xs leading-relaxed text-zinc-400">{m.detail}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ProductFeatures />

      {/* Tool Cards */}
      <section id="tools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              AI Suite
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
              Find the right studio for every photo or video
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Search by task or filter by editing, creating, and restoring. Open any photo or video studio directly from here.
            </p>
          </div>
        </div>

        <ToolExplorer />
      </section>

      {/* Inline Multi-Tool Live Studio */}
      <section id="studio" className="scroll-mt-20">
        <LiveStudioWorkspace />
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
