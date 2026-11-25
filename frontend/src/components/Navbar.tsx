"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Menu, Moon, Sparkles, Sun, User, X, Zap } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useCredits } from "./CreditsContext";
import { useAuth } from "./AuthContext";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { credits, dailyLimit } = useCredits();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/tools/background-remover", label: "Bg Remover" },
    { href: "/tools/upscaler", label: "Upscaler" },
    { href: "/tools/object-remover", label: "Object Remover" },
    { href: "/tools/photo-restorer", label: "Restorer" },
    { href: "/tools/passport-maker", label: "Passport" },
  ];

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
              Zenvyra
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <div
            title="Daily free AI credits"
            className="flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50/80 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300"
          >
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            <span>
              {credits}/{dailyLimit} credits
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light/dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>

    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
