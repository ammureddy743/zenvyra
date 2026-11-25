import { Suspense } from "react";
import { UpscalerStudio } from "@/components/UpscalerStudio";

export const metadata = {
  title: "Image Upscaler — Zenvyra",
  description: "Upscale photos 2x or 4x with detail sharpening and denoising.",
};

export default function UpscalerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading studio...</div>}>
      <UpscalerStudio />
    </Suspense>
  );
}
