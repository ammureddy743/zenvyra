"use client";

import React, { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { useAuth } from "./AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfoMsg(null);

    const res =
      mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, fullName);

    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.message) {
      setInfoMsg(res.message);
      return;
    }
    onClose();
  };

  const handleGoogle = async () => {
    setError(null);
    const res = await signInWithGoogle();
    if (res.error) setError(res.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold tracking-tight">
          {mode === "signin" ? "Sign in to Zenvyra" : "Create your Zenvyra account"}
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Use your email ID to sign in and manage your daily AI credits.
        </p>

        {/* Mode Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setInfoMsg(null);
            }}
            className={`rounded-lg py-1.5 transition-colors ${
              mode === "signin"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setInfoMsg(null);
            }}
            className={`rounded-lg py-1.5 transition-colors ${
              mode === "signup"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500"
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}
        {infoMsg && (
          <div className="mt-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-700 dark:text-emerald-200">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1">Email ID</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {mode === "signin" ? "Login with Email" : "Create Account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span>or</span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
