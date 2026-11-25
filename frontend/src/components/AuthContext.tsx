"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthResult {
  error: string | null;
  message?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isSupabaseReady: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const LOCAL_USER_KEY = "zenvyra-local-user";
const LOCAL_ACCOUNTS_KEY = "zenvyra-local-accounts";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  isSupabaseReady: false,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const initSupabaseAuth = async () => {
        try {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            url.searchParams.delete("code");
            window.history.replaceState({}, "", url.pathname + url.search + url.hash);
          }

          const { data } = await supabase.auth.getSession();
          const sessionUser = data.session?.user;
          if (sessionUser?.email) {
            setUser({
              id: sessionUser.id,
              email: sessionUser.email,
              name: sessionUser.user_metadata?.full_name,
            });
          }
        } finally {
          setLoading(false);
        }
      };

      initSupabaseAuth();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name,
          });
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }

    // Local fallback when Supabase env vars are not configured yet
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      if (saved) setUser(JSON.parse(saved) as AuthUser);
    } catch {
      // ignore storage errors
    }
    setLoading(false);
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    }

    try {
      const accounts = JSON.parse(
        localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "{}"
      ) as Record<string, { password: string; name?: string }>;
      const existing = accounts[cleanEmail];
      if (existing && existing.password !== password) {
        return { error: "Incorrect password for this email." };
      }
      if (!existing) {
        accounts[cleanEmail] = { password, name: cleanEmail.split("@")[0] };
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
      }
      const nextUser: AuthUser = {
        id: cleanEmail,
        email: cleanEmail,
        name: existing?.name || cleanEmail.split("@")[0],
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return { error: null };
    } catch {
      return { error: "Unable to sign in in this browser." };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName?.trim() || cleanEmail.split("@")[0] },
        },
      });
      if (error) return { error: error.message };
      if (!data.session) {
        return {
          error: null,
          message: "Check your email inbox to confirm your account.",
        };
      }
      return { error: null };
    }

    try {
      const accounts = JSON.parse(
        localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "{}"
      ) as Record<string, { password: string; name?: string }>;
      if (accounts[cleanEmail]) {
        return { error: "An account with this email already exists. Please sign in." };
      }
      const name = fullName?.trim() || cleanEmail.split("@")[0];
      accounts[cleanEmail] = { password, name };
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
      const nextUser: AuthUser = { id: cleanEmail, email: cleanEmail, name };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return { error: null };
    } catch {
      return { error: "Unable to create account in this browser." };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        error:
          "Google login requires Supabase keys (NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY). Use email login above or configure Supabase.",
      };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseReady: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
