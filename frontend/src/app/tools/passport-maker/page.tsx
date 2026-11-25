import { Suspense } from "react";
import { PassportMakerStudio } from "@/components/PassportMakerStudio";

export const metadata = {
  title: "Passport Photo Maker — Zenvyra",
  description: "Auto-crop and format compliant passport photos with custom backgrounds.",
};

export default function PassportMakerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading studio...</div>}>
      <PassportMakerStudio />
    </Suspense>
  );
}
