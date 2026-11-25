import { BackgroundRemoverStudio } from "@/components/BackgroundRemoverStudio";

export const metadata = {
  title: "Background Remover — Zenvyra",
  description:
    "Remove photo backgrounds at full resolution using BiRefNet and IS-Net AI models with edge refinement and manual touch-up.",
};

export default function BackgroundRemoverPage() {
  return <BackgroundRemoverStudio />;
}
