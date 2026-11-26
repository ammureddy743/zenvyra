"use client";

import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthModal } from "./AuthModal";

export function PricingSection() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Pricing
          </span>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
            Simple, transparent plans
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Start editing immediately with 10 free daily credits. Upgrade when you need unlimited high-volume workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          {/* Free Starter */}
          <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-7">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Free Starter</h3>
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  No card required
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold">
                $0 <span className="text-sm font-normal text-zinc-500">/ day</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Ideal for quick cutouts, passport photos, and personal projects.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  10 free AI edits every day
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  Full-resolution PNG &amp; 96% JPEG export
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  Touch-up brush &amp; edge refinement
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  Access to all 6 AI studio tools
                </li>
              </ul>
            </div>

            <a
              href="#studio"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Start Editing Free
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Pro Studio */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-violet-500/70 bg-gradient-to-br from-violet-600/10 via-fuchsia-500/5 to-cyan-500/10 p-6 sm:p-7 shadow-lg shadow-violet-500/5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Pro Studio</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold">
                $12 <span className="text-sm font-normal text-zinc-500">/ month</span>
              </div>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Built for creators, e-commerce sellers, and design teams.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-violet-500" />
                  Unlimited daily AI edits across all 6 tools
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-violet-500" />
                  Priority GPU inference queue
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-violet-500" />
                  BiRefNet &amp; 4× high-detail upscaling
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-violet-500" />
                  24-hour encrypted cloud workspace
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) setAuthOpen(true);
              }}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-opacity"
            >
              {user ? "Signed In — Pro Ready" : "Sign In to Upgrade"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
