import { Suspense } from "react";
import { ImageGeneratorStudio } from "@/components/ImageGeneratorStudio";

export const metadata = {
  title: "AI Image Generator — Zenvyra",
  description: "Create high-resolution AI images from text prompts.",
};

export default function ImageGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading generator...</div>}>
      <ImageGeneratorStudio />
    </Suspense>
  );
}
