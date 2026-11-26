import Link from "next/link";
import {
  ArrowUpRight,
  Eraser,
  Maximize2,
  Scissors,
  Sparkles,
  UserSquare2,
  Wand2,
} from "lucide-react";

const FEATURES = [
  {
    number: "01",
    label: "CREATE",
    title: "From a few words to a whole new world.",
    description: "Create images from a prompt, or bring a still idea to life with video generation.",
    href: "/tools/image-generator",
    icon: Sparkles,
    style: "feature-card-create",
  },
  {
    number: "02",
    label: "CUT OUT",
    title: "Keep the subject. Lose the clutter.",
    description: "Separate a subject from its background and export a clean transparent image.",
    href: "/tools/background-remover",
    icon: Scissors,
    style: "feature-card-remove",
  },
  {
    number: "03",
    label: "ERASE",
    title: "Clear away the things that get in the way.",
    description: "Mark unwanted objects and let the scene fill in naturally, then refine with the brush.",
    href: "/tools/object-remover",
    icon: Eraser,
    style: "feature-card-retouch",
  },
  {
    number: "04",
    label: "UPSCALE",
    title: "More pixels. More room to work.",
    description: "Upscale images by 2x or 4x with detail-preserving enhancement.",
    href: "/tools/upscaler",
    icon: Maximize2,
    style: "feature-card-upscale",
  },
  {
    number: "05",
    label: "MAKE PRINT-READY",
    title: "ID photos, sized and ready to go.",
    description: "Choose a passport preset, background, and print sheet for the photo you need.",
    href: "/tools/passport-maker",
    icon: UserSquare2,
    style: "feature-card-id",
  },
  {
    number: "06",
    label: "REFINE",
    title: "See every detail before you export.",
    description: "Compare before and after, zoom in, then make precise brush touch-ups to your result.",
    href: "/#studio",
    icon: Wand2,
    style: "feature-card-restore",
  },
];

export function ProductFeatures() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="features-title">
      <div className="mb-8 grid gap-5 sm:mb-10 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-8">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
            A studio for every idea
          </span>
          <h2 id="features-title" className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            All the ways to make an image your own.
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:col-span-4 sm:pb-1 sm:text-base">
          Start with a single edit or move between six dedicated studios, each designed around a different creative task.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.number}
              href={feature.href}
              className={`group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/5 dark:border-white/10 dark:bg-zinc-900/70 dark:hover:border-violet-500/50 ${feature.style}`}
            >
              <div aria-hidden="true" className="feature-card-glow absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-70 blur-3xl transition duration-500 group-hover:scale-125" />
              <div className="relative flex items-start justify-between">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/5 text-violet-700 dark:bg-white/10 dark:text-violet-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs tracking-widest text-zinc-400">{feature.number}</span>
              </div>
              <div className="relative mt-12">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-violet-600 dark:text-violet-300">{feature.label}</p>
                <h3 className="mt-2 max-w-xs text-xl font-semibold leading-snug tracking-tight text-zinc-950 dark:text-white">{feature.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{feature.description}</p>
              </div>
              <div className="relative mt-5 flex items-center justify-between border-t border-zinc-200/80 pt-4 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:text-zinc-200">
                <span>Explore this studio</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-100/80 p-5 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
        <div>
          <p className="text-sm font-semibold">One workspace. Your whole edit.</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Compare results, refine details, then export in the format you need.</p>
        </div>
        <Link href="#studio" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-violet-200">
          Open the live studio <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
