"use client";

import React, { createContext, useCallback, useContext, useRef } from "react";
import { useRouter } from "next/navigation";

interface ToolHandoffContextValue {
  sendToTool: (
    imageUrl: string,
    filename: string,
    targetHref: string
  ) => Promise<void>;
  consumePendingFile: () => File | null;
}

const ToolHandoffContext = createContext<ToolHandoffContextValue | null>(null);

export function ToolHandoffProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pendingFileRef = useRef<File | null>(null);

  const sendToTool = useCallback(
    async (imageUrl: string, filename: string, targetHref: string) => {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const mime = blob.type || "image/png";
        const ext = mime.includes("jpeg") ? "jpg" : "png";
        const safeName = filename.replace(/\.[^/.]+$/, "") + `.${ext}`;
        pendingFileRef.current = new File([blob], safeName, { type: mime });
        router.push(targetHref);
      } catch {
        // Fallback: navigate even if blob conversion fails
        router.push(targetHref);
      }
    },
    [router]
  );

  const consumePendingFile = useCallback(() => {
    const file = pendingFileRef.current;
    pendingFileRef.current = null;
    return file;
  }, []);

  return (
    <ToolHandoffContext.Provider value={{ sendToTool, consumePendingFile }}>
      {children}
    </ToolHandoffContext.Provider>
  );
}

export function useToolHandoff() {
  const ctx = useContext(ToolHandoffContext);
  if (!ctx) {
    throw new Error("useToolHandoff must be used within ToolHandoffProvider");
  }
  return ctx;
}
