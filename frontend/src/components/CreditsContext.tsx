"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const DAILY_LIMIT = 10;
const STORAGE_KEY = "zenvyra-daily-credits";

interface CreditsContextValue {
  credits: number;
  dailyLimit: number;
  consumeCredit: () => boolean;
}

const CreditsContext = createContext<CreditsContextValue>({
  credits: DAILY_LIMIT,
  dailyLimit: DAILY_LIMIT,
  consumeCredit: () => true,
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number>(DAILY_LIMIT);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { date: string; remaining: number };
        if (parsed.date === today && typeof parsed.remaining === "number") {
          setCredits(parsed.remaining);
          return;
        }
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, remaining: DAILY_LIMIT })
      );
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  const consumeCredit = (): boolean => {
    if (credits <= 0) return false;
    const next = credits - 1;
    setCredits(next);
    const today = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, remaining: next })
      );
    } catch {
      // Ignore storage errors
    }
    return true;
  };

  return (
    <CreditsContext.Provider
      value={{ credits, dailyLimit: DAILY_LIMIT, consumeCredit }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
