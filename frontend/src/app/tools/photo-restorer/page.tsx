import { Suspense } from "react";
import { PhotoRestorerStudio } from "@/components/PhotoRestorerStudio";

export const metadata = {
  title: "Old Photo Restorer — Zenvyra",
  description: "Restore faded photos, reduce noise, sharpen details, and colorize.",
};

export default function PhotoRestorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading studio...</div>}>
      <PhotoRestorerStudio />
    </Suspense>
  );
}
