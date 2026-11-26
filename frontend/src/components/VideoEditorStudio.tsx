"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Download,
  Film,
  Loader2,
  Play,
  Scissors,
  Video,
} from "lucide-react";

type AspectRatio = "original" | "16:9" | "9:16" | "1:1";
const MAX_VIDEO_SIZE = 250 * 1024 * 1024;
const MAX_CLIP_SECONDS = 120;

function formatTime(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = Math.floor(safeValue % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function outputDimensions(ratio: AspectRatio, video: HTMLVideoElement) {
  if (ratio === "16:9") return { width: 1280, height: 720 };
  if (ratio === "9:16") return { width: 720, height: 1280 };
  if (ratio === "1:1") return { width: 1080, height: 1080 };
  const scale = Math.min(1280 / video.videoWidth, 1280 / video.videoHeight, 1);
  return {
    width: Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2),
    height: Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2),
  };
}

function drawCroppedFrame(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  ratio: AspectRatio
) {
  if (!video.videoWidth || !video.videoHeight) return;
  const { width, height } = outputDimensions(ratio, video);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  const targetRatio = width / height;
  const sourceRatio = video.videoWidth / video.videoHeight;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;
  if (sourceRatio > targetRatio) {
    sourceWidth = video.videoHeight * targetRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = video.videoWidth / targetRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);
  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

export function VideoEditorStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("zenvyra-video");
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("original");
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputType, setOutputType] = useState<"MP4" | "WebM">("WebM");
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  useEffect(() => () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
  }, [outputUrl]);

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamsRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
  }, []);

  const chooseVideo = (file?: File) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError("");
    setOutputUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (!file.type.startsWith("video/")) {
      setError("Choose a video file such as MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setError("Videos must be 250 MB or smaller.");
      return;
    }
    setFileName(file.name.replace(/\.[^.]+$/, "") || "zenvyra-video");
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setAspectRatio("original");
    setProgress(0);
    setVideoUrl(URL.createObjectURL(file));
  };

  const handleMetadata = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    setDuration(video.duration);
    setStartTime(0);
    setEndTime(Math.min(video.duration, MAX_CLIP_SECONDS));
    drawCroppedFrame(canvasRef.current!, video, aspectRatio);
  };

  const setTrimStart = (value: number) => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    videoRef.current?.pause();
    const next = Math.max(0, Math.min(value, endTime - 0.2));
    setStartTime(next);
    setOutputUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setError("");
  };

  const setTrimEnd = (value: number) => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    videoRef.current?.pause();
    const next = Math.min(duration, startTime + MAX_CLIP_SECONDS, Math.max(value, startTime + 0.2));
    setEndTime(next);
    setOutputUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setError("");
  };

  const previewSelection = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.pause();
      if (Math.abs(video.currentTime - startTime) > 0.05) {
        await new Promise<void>((resolve) => {
          video.addEventListener("seeked", () => resolve(), { once: true });
          video.currentTime = startTime;
        });
      }
      await video.play();
      const stopAtTrimEnd = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          return;
        }
        animationRef.current = requestAnimationFrame(stopAtTrimEnd);
      };
      animationRef.current = requestAnimationFrame(stopAtTrimEnd);
    } catch {
      setError("Could not preview this clip in the browser.");
    }
  };

  const exportVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || endTime - startTime < 0.2) {
      setError("Set a valid clip range before exporting.");
      return;
    }
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      setError("Video export is not supported in this browser. Try a current version of Chrome, Edge, or Firefox.");
      return;
    }

    const captureableVideo = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const captureVideo = captureableVideo.captureStream?.bind(video) ??
      captureableVideo.mozCaptureStream?.bind(video);
    if (!captureVideo) {
      setError("This browser cannot capture the source audio for export. Try a current version of Chrome, Edge, or Firefox.");
      return;
    }

    setError("");
    setIsExporting(true);
    setProgress(0);
    video.pause();
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    drawCroppedFrame(canvas, video, aspectRatio);

    let activeRecorder: MediaRecorder | null = null;
    let activeStreams: MediaStream[] = [];
    let recorderFailed = false;
    try {
      if (Math.abs(video.currentTime - startTime) > 0.05) {
        await new Promise<void>((resolve) => {
          video.addEventListener("seeked", () => resolve(), { once: true });
          video.currentTime = startTime;
        });
      }

      const sourceStream = captureVideo();
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...sourceStream.getAudioTracks(),
      ]);
      activeStreams = [combinedStream, sourceStream, canvasStream];
      streamsRef.current = activeStreams;
      const supportedTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/mp4",
        "video/webm",
      ];
      const mimeType = supportedTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(combinedStream, { mimeType })
        : new MediaRecorder(combinedStream);
      activeRecorder = recorder;
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      const extension = recorder.mimeType.includes("mp4") ? "mp4" : "webm";
      setOutputType(extension === "mp4" ? "MP4" : "WebM");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => {
        recorderFailed = true;
        activeStreams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
        streamsRef.current = [];
        video.pause();
        setIsExporting(false);
        setError("The video could not be exported. Try a shorter clip or a different browser.");
      };
      recorder.onstop = () => {
        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        combinedStream.getTracks().forEach((track) => track.stop());
        sourceStream.getTracks().forEach((track) => track.stop());
        canvasStream.getTracks().forEach((track) => track.stop());
        streamsRef.current = [];
        recorderRef.current = null;
        if (recorderFailed) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        setOutputUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(blob);
        });
        setIsExporting(false);
        setProgress(100);
      };

      recorder.start(250);
      await video.play();
      let lastProgressUpdate = 0;
      const renderFrame = () => {
        drawCroppedFrame(canvas, video, aspectRatio);
        const now = performance.now();
        if (now - lastProgressUpdate >= 200) {
          setProgress(Math.min(99, ((video.currentTime - startTime) / (endTime - startTime)) * 100));
          lastProgressUpdate = now;
        }
        if (video.currentTime >= endTime || video.ended) {
          video.pause();
          if (recorder.state === "recording") recorder.stop();
          return;
        }
        animationRef.current = requestAnimationFrame(renderFrame);
      };
      animationRef.current = requestAnimationFrame(renderFrame);
    } catch {
      recorderFailed = true;
      if (activeRecorder?.state === "recording") activeRecorder.stop();
      activeStreams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
      streamsRef.current = [];
      recorderRef.current = null;
      setIsExporting(false);
      setError("Could not start video export. Check that the file is playable and try again.");
    }
  };

  const downloadName = `${fileName}-edit.${outputType === "MP4" ? "mp4" : "webm"}`;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="video-editor-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">Quick video editing</p>
          <h1 id="video-editor-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Video Editor</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">Trim a clip, crop it for your platform, and export a shareable video.</p>
        </div>
        {videoUrl && <button type="button" disabled={isExporting} onClick={() => inputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium disabled:opacity-40 dark:border-zinc-800"><Video className="h-4 w-4" /> Replace clip</button>}
      </div>

      {!videoUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseVideo(event.dataTransfer.files[0]); }}
          className={`flex min-h-[340px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition ${isDragging ? "border-violet-500 bg-violet-500/10" : "border-zinc-300 bg-white hover:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900/50"}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Clapperboard className="h-8 w-8" /></span>
          <span className="mt-5 text-lg font-semibold">Drop a video to start editing</span>
          <span className="mt-2 text-sm text-zinc-500">MP4, WebM, or MOV · up to 250 MB</span>
          <span className="mt-5 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">Choose a video</span>
        </button>
      ) : (
        <div className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-zinc-300">
              <span className="flex min-w-0 items-center gap-2"><Film className="h-4 w-4 shrink-0 text-violet-300" /><span className="truncate">{fileName}</span></span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="mx-auto flex max-h-[60vh] items-center justify-center overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: aspectRatio === "original" ? `${videoRef.current?.videoWidth || 16} / ${videoRef.current?.videoHeight || 9}` : aspectRatio.replace(":", " / "), width: aspectRatio === "9:16" ? "min(100%, 405px)" : "100%", maxWidth: "100%" }}>
              <video key={videoUrl} ref={videoRef} src={videoUrl} controls={!isExporting} playsInline onLoadedMetadata={handleMetadata} onError={() => setError("This browser cannot play this video format. Try an MP4 or WebM clip.")} onTimeUpdate={() => { if (!isExporting && videoRef.current && canvasRef.current) drawCroppedFrame(canvasRef.current, videoRef.current, aspectRatio); }} className="h-full w-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-label="Export progress"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-[width]" style={{ width: `${progress}%` }} /></div>
          </div>

          <aside className="space-y-5 border-t border-zinc-200 p-5 dark:border-zinc-800 lg:border-l lg:border-t-0">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Scissors className="h-4 w-4 text-violet-600" /> Trim clip</h2>
              <p className="mt-1 text-xs text-zinc-500">Choose the part you want to keep. Up to 2 minutes per export.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-xs text-zinc-500">Start
                  <input type="number" min={0} max={Math.max(0, endTime - 0.2)} step={0.1} value={startTime.toFixed(1)} disabled={isExporting} onChange={(event) => setTrimStart(Number(event.target.value))} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 font-mono text-zinc-900 outline-none focus:border-violet-500 disabled:opacity-50 dark:border-zinc-700 dark:text-white" />
                </label>
                <label className="text-xs text-zinc-500">End
                  <input type="number" min={Math.min(duration, startTime + 0.2)} max={Math.min(duration, startTime + MAX_CLIP_SECONDS)} step={0.1} value={endTime.toFixed(1)} disabled={isExporting} onChange={(event) => setTrimEnd(Number(event.target.value))} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 font-mono text-zinc-900 outline-none focus:border-violet-500 disabled:opacity-50 dark:border-zinc-700 dark:text-white" />
                </label>
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-400"><span>{formatTime(startTime)}</span><span>Clip length {formatTime(endTime - startTime)}</span><span>{formatTime(endTime)}</span></div>
              <button type="button" onClick={previewSelection} disabled={isExporting || endTime <= startTime} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-800"><Play className="h-3.5 w-3.5" /> Preview selected clip</button>
            </div>

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold">Crop for</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["original", "16:9", "9:16", "1:1"] as const).map((ratio) => (
                  <button key={ratio} type="button" aria-pressed={aspectRatio === ratio} disabled={isExporting} onClick={() => { setAspectRatio(ratio); setOutputUrl((current) => { if (current) URL.revokeObjectURL(current); return null; }); if (videoRef.current && canvasRef.current) drawCroppedFrame(canvasRef.current, videoRef.current, ratio); }} className={`rounded-xl border py-2.5 text-xs font-semibold disabled:opacity-50 ${aspectRatio === ratio ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" : "border-zinc-200 dark:border-zinc-800"}`}>{ratio === "original" ? "Original" : ratio}</button>
                ))}
              </div>
            </div>

            {isExporting ? (
              <button type="button" disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white opacity-80"><Loader2 className="h-4 w-4 animate-spin" /> Exporting {Math.round(progress)}%</button>
            ) : outputUrl ? (
              <a href={outputUrl} download={downloadName} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"><Download className="h-4 w-4" /> Download {outputType}</a>
            ) : (
              <button type="button" onClick={exportVideo} disabled={duration <= 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" /> Export video</button>
            )}
            <p className="text-[11px] leading-relaxed text-zinc-500">Video exports use your browser’s recorder and save as MP4 when supported, otherwise WebM. Longer clips are limited to two minutes.</p>
          </aside>
        </div>
      )}
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event) => chooseVideo(event.target.files?.[0])} />
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
    </section>
  );
}
