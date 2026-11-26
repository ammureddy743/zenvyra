import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";

const TOOL_LINKS = [
  { href: "/tools/background-remover", label: "Background Remover" },
  { href: "/tools/upscaler", label: "Image Upscaler" },
  { href: "/tools/object-remover", label: "Object Remover" },
  { href: "/tools/photo-restorer", label: "Old Photo Restorer" },
  { href: "/tools/passport-maker", label: "Passport Photo Maker" },
  { href: "/tools/image-generator", label: "AI Image Generator" },
];

const PLATFORM_LINKS = [
  { href: "/#studio", label: "Live Studio" },
  { href: "/#tools", label: "All AI Tools" },
  { href: "/#workflow", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                Zenvyra
              </span>
            </Link>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              Full-resolution AI photo studio in your browser. Cutouts, 4× upscaling,
              object removal, restoration, compliant IDs, and image generation—without
              compression.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Zero-retention privacy • Auto-deleted in 24h
            </div>
          </div>

          {/* AI Tools */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              AI Studio Tools
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 text-sm">
              {TOOL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              {PLATFORM_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© 2026 Zenvyra Studio. All rights reserved.</p>
          <p>Lossless PNG &amp; 96% JPEG • Max 20 MB per image</p>
        </div>
      </div>
    </footer>
  );
}
