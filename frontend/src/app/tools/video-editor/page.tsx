import { VideoEditorStudio } from "@/components/VideoEditorStudio";

export const metadata = {
  title: "Video Editor — Zenvyra",
  description: "Trim and crop videos for common formats, then export from your browser.",
};

export default function VideoEditorPage() {
  return <VideoEditorStudio />;
}
