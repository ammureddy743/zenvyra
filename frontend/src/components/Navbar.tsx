"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Eraser,
  Film,
  ImageIcon,
  LogIn,
  LogOut,
  Maximize2,
  Menu,
  Moon,
  Scissors,
  Sparkles,
  Sun,
  User,
  UserSquare2,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useCredits } from "./CreditsContext";
import { useAuth } from "./AuthContext";
import { AuthModal } from "./AuthModal";

const TOOL_MENU = [
  {
    href: "/tools/background-remover",
    label: "Background Remover",
    desc: "Full-res BiRefNet & IS-Net cutouts",
    icon: Scissors,
  },
  {
    href: "/tools/upscaler",
    label: "Image Upscaler",
    desc: "2× and 4× detail-preserving upscale",
    icon: Maximize2,
  },
  {
    href: "/tools/object-remover",
    label: "Object Remover",
    desc: "Erase people, text & blemishes",
    icon: Eraser,
  },
  {
    href: "/tools/photo-restorer",
    label: "Old Photo Restorer",
    desc: "Sharpen faces & colorize vintage",
    icon: Wand2,
  },
  {
    href: "/tools/passport-maker",
    label: "Passport Photo Maker",
    desc: "Compliant IDs & 4×6 print sheets",
    icon: UserSquare2,
  },
  {
    href: "/tools/image-generator",
    label: "AI Image & Video",
    desc: "Generate images & motion videos",
    icon: Sparkles,
  },
  {
    href: "/tools/photo-editor",
    label: "Photo Editor",
    desc: "Crop, color, rotate & caption",
    icon: ImageIcon,
  },
  {
    href: "/tools/video-editor",
    label: "Video Editor",
    desc: "InShot-style trim, songs & filters",
    icon: Film,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { credits, dailyLimit } = useCredits();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isToolRoute = pathname.startsWith("/tools/");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
              Zenvyra
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setToolsOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  isToolRoute || toolsOpen
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                <span>AI Tools</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-150 ${
                    toolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {toolsOpen && (
                <div className="absolute left-0 top-full mt-3 w-[520px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-2xl">
                  <div className="grid grid-cols-2 gap-1.5">
                    {TOOL_MENU.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setToolsOpen(false)}
                          className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors ${
                            active
                              ? "bg-violet-50 dark:bg-violet-950/40"
                              : "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70"
                          }`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/#studio"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Live Studio
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div
              title="Daily free AI credits"
              className="flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50/80 dark:bg-violet-950/40 px-2.5 sm:px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <span>
                {credits}/{dailyLimit}
                <span className="hidden sm:inline"> credits</span>
              </span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle light/dark mode"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  title={user.email}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 max-w-[160px] truncate"
                >
                  <User className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <span className="truncate">{user.email}</span>
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Logout"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 sm:px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-3">
            {user && (
              <div className="sm:hidden flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                <User className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-2">
              AI Tools
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TOOL_MENU.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-violet-500" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2.5 flex items-center gap-4 px-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Link href="/#studio" onClick={() => setMobileOpen(false)}>
                Live Studio
              </Link>
              <Link href="/#pricing" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>
              <Link href="/#faq" onClick={() => setMobileOpen(false)}>
                FAQ
              </Link>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
