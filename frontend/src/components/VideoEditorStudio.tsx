"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines, Captions, ChevronDown, Clapperboard, Download, Film, FlipHorizontal,
  Gauge, ImagePlus, Music2, Pause, Play, Plus, RotateCw, Scissors, SlidersHorizontal,
  Sparkles, Type, Upload, Volume2, VolumeX, WandSparkles,
} from "lucide-react";

type Ratio = "16:9" | "9:16" | "1:1" | "4:5";
type Panel = "Media" | "Audio" | "Text" | "Filters" | "Adjust";
const RATIOS: { id: Ratio; label: string; width: number; height: number }[] = [
  { id: "16:9", label: "16:9", width: 1920, height: 1080 },
  { id: "9:16", label: "9:16", width: 1080, height: 1920 },
  { id: "1:1", label: "1:1", width: 1080, height: 1080 },
  { id: "4:5", label: "4:5", width: 1080, height: 1350 },
];
const FILTERS = [
  { name: "Original", css: "none" }, { name: "Vivid", css: "saturate(1.5) contrast(1.08)" },
  { name: "Warm", css: "sepia(.25) saturate(1.25)" }, { name: "Cool", css: "hue-rotate(15deg) saturate(1.15)" },
  { name: "Cinema", css: "contrast(1.2) saturate(.85) brightness(.94)" }, { name: "Mono", css: "grayscale(1) contrast(1.12)" },
];
const fmt = (time: number) => {
  const s = Math.max(0, Math.floor(time || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function VideoEditorStudio() {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const videoSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState("");
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("");
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [panel, setPanel] = useState<Panel>("Media");
  const [mediaSearch, setMediaSearch] = useState("");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [ratioOpen, setRatioOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(.8);
  const [muted, setMuted] = useState(false);
  const [filter, setFilter] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [clipScale, setClipScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [caption, setCaption] = useState("");
  const [captionColor, setCaptionColor] = useState("#ffffff");
  const [captionPosition, setCaptionPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(true);

  const releaseUrl = (url: string | null) => { if (url) URL.revokeObjectURL(url); };
  useEffect(() => () => { releaseUrl(videoUrl); }, [videoUrl]);
  useEffect(() => () => { releaseUrl(audioUrl); }, [audioUrl]);
  useEffect(() => () => { if (audioContextRef.current && audioContextRef.current.state !== "closed") void audioContextRef.current.close(); }, []);
  useEffect(() => { if (videoRef.current) { videoRef.current.playbackRate = speed; videoRef.current.volume = muted ? 0 : volume; } }, [speed, muted, volume]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = musicVolume; }, [musicVolume, audioUrl]);
  useEffect(() => {
    if (saved) return;
    const id = window.setTimeout(() => setSaved(true), 650);
    return () => window.clearTimeout(id);
  }, [saved, caption, ratio, speed, filter, brightness, contrast, opacity, rotation, flip, trimStart, trimEnd, videoName]);

  const importVideo = useCallback((file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Choose a valid video file."); return; }
    setError("");
    setThumbs([]);
    setVideoUrl(URL.createObjectURL(file)); setVideoName(file.name);
    setCurrent(0); setPlaying(false); setTrimStart(0); setTrimEnd(0); setSaved(false);
  }, []);

  useEffect(() => {
    if (!videoUrl) return;
    let cancelled = false;
    const probe = document.createElement("video");
    probe.muted = true;
    probe.playsInline = true;
    probe.preload = "auto";
    probe.src = videoUrl;

    const extract = async () => {
      await new Promise<void>((res) => {
        probe.onloadeddata = () => res();
        probe.onerror = () => res();
      });
      const dur = probe.duration || 0;
      if (cancelled || !dur || !probe.videoWidth) return;
      const count = 8;
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 68;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const list: string[] = [];
      for (let i = 0; i < count; i++) {
        if (cancelled) return;
        const target = (dur * (i + 0.2)) / count;
        await new Promise<void>((res) => {
          probe.onseeked = () => res();
          probe.currentTime = Math.min(dur - 0.05, Math.max(0, target));
        });
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
        list.push(canvas.toDataURL("image/jpeg", 0.65));
      }
      if (!cancelled) setThumbs(list);
    };
    void extract();
    return () => { cancelled = true; };
  }, [videoUrl]);
  const importAudio = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setError("Choose a valid audio file."); return; }
    setError(""); setAudioUrl(URL.createObjectURL(file)); setAudioName(file.name); setPanel("Audio"); setSaved(false);
  };
  const togglePlayback = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < trimStart || (trimEnd && v.currentTime >= trimEnd)) v.currentTime = trimStart;
      try { await v.play(); if (audioUrl) await audioRef.current?.play(); setPlaying(true); }
      catch { setError("This video could not be played in your browser."); }
    } else { v.pause(); audioRef.current?.pause(); setPlaying(false); }
  };
  const onTime = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    if (trimEnd > trimStart && v.currentTime >= trimEnd) {
      v.pause(); v.currentTime = trimStart; audioRef.current?.pause(); setPlaying(false);
    }
  };

  const exportVideo = async () => {
    const video = videoRef.current;
    if (!video || !videoUrl || !video.videoWidth) return;
    setExporting(true); setError("");
    video.pause(); audioRef.current?.pause(); setPlaying(false);
    let destination: MediaStreamAudioDestinationNode | null = null;
    try {
      const outputRatio = RATIOS.find((item) => item.id === ratio)!;
      const canvas = document.createElement("canvas");
      canvas.width = outputRatio.width; canvas.height = outputRatio.height;
      const ctx = canvas.getContext("2d");
      if (!ctx || !canvas.captureStream || !window.MediaRecorder) throw new Error("Video export is not supported by this browser.");
      const stream = canvas.captureStream(30);
      const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextConstructor) {
        const context = audioContextRef.current || new AudioContextConstructor();
        audioContextRef.current = context;
        destination = context.createMediaStreamDestination();
        if (!muted && volume > 0) {
          videoSourceRef.current ||= context.createMediaElementSource(video);
          videoSourceRef.current.connect(destination);
        }
        if (audioUrl && musicVolume > 0 && audioRef.current) {
          musicSourceRef.current ||= context.createMediaElementSource(audioRef.current);
          musicSourceRef.current.connect(destination);
        }
        destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        await context.resume();
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const finished = new Promise<Blob>((resolve, reject) => { recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" })); recorder.onerror = () => reject(new Error("The recording could not be completed.")); });
      const stopAt = trimEnd || duration;
      video.currentTime = trimStart;
      await new Promise<void>((resolve) => { video.addEventListener("seeked", () => resolve(), { once: true }); window.setTimeout(resolve, 700); });
      if (audioRef.current) audioRef.current.currentTime = 0;
      recorder.start(250); await video.play(); if (audioUrl) await audioRef.current?.play();
      const draw = () => {
        if (video.paused || video.ended || video.currentTime >= stopAt) { if (recorder.state === "recording") recorder.stop(); video.pause(); audioRef.current?.pause(); return; }
        ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.globalAlpha = opacity / 100;
        ctx.filter = `${filter} brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rotation * Math.PI / 180); ctx.scale(flip ? -1 : 1, 1);
        const rotated = rotation % 180 !== 0;
        const fitScale = Math.min(canvas.width / (rotated ? video.videoHeight : video.videoWidth), canvas.height / (rotated ? video.videoWidth : video.videoHeight)) * clipScale / 100;
        ctx.drawImage(video, -video.videoWidth * fitScale / 2, -video.videoHeight * fitScale / 2, video.videoWidth * fitScale, video.videoHeight * fitScale);
        ctx.restore();
        if (caption.trim()) { ctx.save(); ctx.font = `bold ${Math.round(canvas.width * .055)}px system-ui`; ctx.textAlign = "center"; ctx.fillStyle = captionColor; ctx.shadowColor = "#000"; ctx.shadowBlur = 10; ctx.fillText(caption, canvas.width / 2, canvas.height * (captionPosition === "top" ? .14 : captionPosition === "center" ? .52 : .88)); ctx.restore(); }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
      const blob = await finished;
      if (!blob.size) throw new Error("The exported video is empty.");
      const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.href = url; link.download = `${videoName.replace(/\.[^/.]+$/, "")}-zenvyra.webm`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not export this video."); }
    finally { destination?.stream.getTracks().forEach((track) => track.stop()); videoSourceRef.current?.disconnect(); musicSourceRef.current?.disconnect(); setExporting(false); setPlaying(false); }
  };

  const iconButton = "flex flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-[11px] font-medium text-[#9a9bad] transition hover:bg-[#242533] hover:text-white";
  const sideItems: { name: Panel; icon: typeof Film }[] = [
    { name: "Media", icon: Film }, { name: "Audio", icon: Music2 }, { name: "Text", icon: Type }, { name: "Filters", icon: Sparkles }, { name: "Adjust", icon: SlidersHorizontal },
  ];
  const clipFilter = `${filter === "none" ? "" : filter} brightness(${brightness}%) contrast(${contrast}%)`.trim();
  const ratioValue = RATIOS.find((item) => item.id === ratio)!;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#101116] p-2 text-[#f1f0f5] sm:p-3 lg:p-4">
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => importVideo(e.target.files?.[0])} />
      <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => importAudio(e.target.files?.[0])} />
      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-[1800px] flex-col overflow-hidden rounded-2xl border border-[#2a2b36] bg-[#0d0e13] shadow-2xl">
        <header className="flex min-h-[62px] flex-wrap items-center gap-3 border-b border-[#292a34] px-4 py-2 sm:px-6">
          <a href="/" className="text-xl font-bold tracking-tight text-[#aa91ff]">Zenvyra</a><span className="text-[#555663]">/</span>
          <input aria-label="Project name" value={videoName ? videoName.replace(/\.[^/.]+$/, "") : "Untitled project"} onChange={(e) => { setVideoName(`${e.target.value || "Untitled project"}.mp4`); setSaved(false); }} className="w-36 bg-transparent text-sm font-semibold outline-none sm:w-48" />
          <span className="text-xs text-[#9293a0]">Local draft</span>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs text-[#9192a0] md:block">Browser editor</span>
            <div className="relative">
              <button type="button" onClick={() => setRatioOpen(!ratioOpen)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#353642] px-3 text-sm hover:bg-[#20212a]">{ratio}<ChevronDown className="h-4 w-4" /></button>
              {ratioOpen && <div className="absolute right-0 top-12 z-40 w-40 rounded-xl border border-[#373845] bg-[#191a22] p-1 shadow-xl">{RATIOS.map((item) => <button key={item.id} type="button" onClick={() => { setRatio(item.id); setRatioOpen(false); setSaved(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#292a36]">{item.label}</button>)}</div>}
            </div>
            <button type="button" onClick={exportVideo} disabled={!videoUrl || exporting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#a38bff] px-4 text-sm font-semibold text-[#171324] transition hover:bg-[#b29fff] disabled:cursor-not-allowed disabled:opacity-45"><Download className="h-4 w-4" />{exporting ? "Exporting…" : "Export"}</button>
          </div>
        </header>

        {error && <div role="alert" className="border-b border-rose-900 bg-rose-950/50 px-5 py-2 text-sm text-rose-200">{error}<button type="button" onClick={() => setError("")} className="ml-3 underline">Dismiss</button></div>}

        <section className="grid min-h-[480px] flex-1 grid-cols-1 lg:grid-cols-[62px_minmax(190px,260px)_minmax(320px,1fr)_minmax(245px,310px)]">
          <nav aria-label="Editor tools" className="order-2 flex gap-1 overflow-x-auto border-t border-[#292a34] bg-[#111218] p-2 lg:order-1 lg:flex-col lg:border-r lg:border-t-0">
            {sideItems.map(({ name, icon: Icon }) => <button key={name} type="button" onClick={() => setPanel(name)} aria-pressed={panel === name} className={`${iconButton} min-w-[62px] lg:w-full ${panel === name ? "bg-[#272535] text-[#ae98ff]" : ""}`}><Icon className="h-5 w-5" />{name}</button>)}
          </nav>

          <aside className="order-3 border-t border-[#292a34] bg-[#14151c] lg:order-2 lg:border-r lg:border-t-0">
            <div className="flex items-center gap-1 border-b border-[#292a34] p-3">
              <button type="button" onClick={() => setPanel("Media")} className="rounded-lg bg-[#282936] px-3 py-2 text-xs font-medium text-white">Local</button>
              <button type="button" disabled title="Stock media is not connected" className="cursor-not-allowed rounded-lg px-3 py-2 text-xs font-medium text-[#666775]">Stock</button>
              <button type="button" disabled title="No brand kit is configured" className="cursor-not-allowed rounded-lg px-3 py-2 text-xs font-medium text-[#666775]">Brand kit</button>
            </div>
            <div className="space-y-4 p-4">
              <h2 className="text-sm font-semibold">{panel === "Media" ? "Your media" : panel === "Audio" ? "Audio library" : panel === "Text" ? "Text & captions" : panel}</h2>
              {panel === "Media" && <>
                <label className="flex items-center gap-2 rounded-lg border border-[#343541] bg-[#101116] px-3 py-2 text-xs text-[#a1a1ae]"><span className="text-lg">⌕</span><input aria-label="Search media" value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder="Search media" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
                <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); importVideo(e.dataTransfer.files[0]); }} className="flex min-h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#494957] px-3 text-center text-sm text-[#d2d0dc] transition hover:border-[#aa91ff] hover:bg-[#1e1d29]"><Plus className="h-5 w-5 text-[#aa91ff]" />Import video</button>
                {videoUrl && videoName.toLowerCase().includes(mediaSearch.toLowerCase()) ? <button type="button" onClick={() => { setCurrent(0); if (videoRef.current) videoRef.current.currentTime = 0; }} className="flex w-full items-center gap-3 rounded-xl border border-[#343541] bg-[#1c1d25] p-2 text-left"><div className="grid h-14 w-20 place-items-center rounded-lg bg-[#262735]"><Film className="h-5 w-5 text-[#aa91ff]" /></div><span className="min-w-0"><span className="block truncate text-xs font-medium">{videoName}</span><span className="mt-1 block text-[10px] text-[#858694]">{fmt(duration)} · Video</span></span></button> : !videoUrl ? <p className="text-xs leading-5 text-[#858694]">Import a video to start editing. Files stay in this browser session.</p> : <p className="text-xs text-[#858694]">No matching media.</p>}
                <button type="button" onClick={() => audioFileRef.current?.click()} className="flex w-full items-center gap-2 rounded-xl border border-[#343541] px-3 py-2.5 text-xs text-[#c5c4d0] hover:bg-[#20212a]"><AudioLines className="h-4 w-4 text-emerald-300" />Import audio</button>
              </>}
              {panel === "Audio" && <>
                <p className="text-xs text-[#8e8f9d]">Add a music or voice track from your device.</p>
                <button type="button" onClick={() => audioFileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#494957] p-4 text-sm hover:border-emerald-300"><Plus className="h-4 w-4" />Import audio</button>
                {audioName && <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-100"><Music2 className="mb-2 h-4 w-4" />{audioName}</div>}
              </>}
              {panel === "Text" && <>
                <button type="button" onClick={() => { setCaption("Your caption here"); setSaved(false); }} className="flex w-full items-center gap-2 rounded-xl border border-[#343541] p-3 text-sm hover:bg-[#20212a]"><Plus className="h-4 w-4 text-[#aa91ff]" />Add a caption</button>
                <p className="text-xs text-[#858694]">Captions are placed over the current video for its full duration.</p>
              </>}
              {(panel === "Filters" || panel === "Adjust") && <p className="text-xs leading-5 text-[#858694]">Select the clip in the preview, then adjust its appearance in the inspector.</p>}
            </div>
          </aside>

          <section className="order-1 flex min-h-[360px] flex-col bg-[#0c0d11] lg:order-3">
            <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-7">
              <div className="relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-[#171820] shadow-[0_14px_50px_#0008]" style={{ aspectRatio: `${ratioValue.width}/${ratioValue.height}`, maxHeight: "min(58vh,680px)", maxWidth: ratio === "9:16" ? "min(48vh,420px)" : "100%" }}>
                {videoUrl ? <video ref={videoRef} src={videoUrl} playsInline onLoadedMetadata={(e) => { const v = e.currentTarget; setDuration(v.duration || 0); setTrimStart(0); setTrimEnd(v.duration || 0); const ar = v.videoWidth / v.videoHeight; setRatio(ar >= 1.25 ? "16:9" : ar <= .75 ? "9:16" : ar < .95 ? "4:5" : "1:1"); }} onTimeUpdate={onTime} onEnded={() => { setPlaying(false); audioRef.current?.pause(); }} className="relative z-10 max-h-full max-w-full object-contain" style={{ filter: clipFilter || "none", opacity: opacity / 100, transform: `rotate(${rotation}deg) scale(${clipScale / 100}) scaleX(${flip ? -1 : 1})` }} /> : <div className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-3 text-center text-[#8c8d9a]"><Clapperboard className="h-10 w-10 text-[#a38bff]" /><p className="text-sm">Your video preview will appear here</p><button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-[#a38bff] px-4 py-2 text-sm font-semibold text-[#171324]">Import video</button></div>}
                {videoUrl && caption && <div className={`pointer-events-none absolute inset-x-4 z-20 text-center text-xl font-bold drop-shadow-[0_2px_8px_#000] sm:text-3xl ${captionPosition === "top" ? "top-4" : captionPosition === "center" ? "top-1/2 -translate-y-1/2" : "bottom-5"}`} style={{ color: captionColor }}>{caption}</div>}
                {audioUrl && <audio ref={audioRef} src={audioUrl} loop className="hidden" />}
              </div>
            </div>
            <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#292a34] px-4 sm:px-6">
              <span className="font-mono text-xs text-[#999aa8]">{fmt(current)} <span className="text-[#555663]">/</span> {fmt(duration)}</span>
              <div className="flex items-center gap-3"><button type="button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(trimStart, current - 5); }} aria-label="Back five seconds" className="text-xs text-[#999aa8] hover:text-white">−5</button><button type="button" onClick={togglePlayback} disabled={!videoUrl} aria-label={playing ? "Pause" : "Play"} className="grid h-11 w-11 place-items-center rounded-full bg-[#efeff6] text-[#171820] hover:bg-white disabled:opacity-40">{playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}</button><button type="button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(trimEnd || duration, current + 5); }} aria-label="Forward five seconds" className="text-xs text-[#999aa8] hover:text-white">+5</button></div>
              <div className="flex items-center gap-3"><span className="hidden text-xs text-[#999aa8] sm:inline">Fit</span><button type="button" onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute" : "Mute"} className="text-[#999aa8] hover:text-white">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button></div>
            </div>
          </section>

          <aside className="order-4 border-t border-[#292a34] bg-[#14151c] lg:border-l lg:border-t-0">
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[#292a34] px-3 py-3">
              {["Video", "Audio", "Speed", "Adjust"].map((tab) => <button key={tab} type="button" onClick={() => setPanel(tab === "Audio" ? "Audio" : tab === "Adjust" ? "Adjust" : tab === "Speed" ? "Adjust" : "Media")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${((tab === "Video" && panel === "Media") || (tab === "Audio" && panel === "Audio") || (tab === "Adjust" && panel === "Adjust")) ? "bg-[#292a37] text-white" : "text-[#9899a7] hover:bg-[#20212a]"}`}>{tab}</button>)}
            </div>
            <div className="max-h-[76vh] space-y-5 overflow-y-auto p-4 text-xs">
              {panel === "Audio" ? <>
                <div className="flex items-center justify-between"><span className="font-semibold">Music</span><span className="text-[#858694]">{audioName || "No audio track"}</span></div>
                <button type="button" onClick={() => audioFileRef.current?.click()} className="w-full rounded-lg border border-[#383945] px-3 py-2 text-left text-[#c9c8d2] hover:bg-[#20212a]">+ Add audio</button>
                <label className="block">Music volume <span className="float-right text-[#a8a8b5]">{Math.round(musicVolume * 100)}%</span><input aria-label="Music volume" type="range" min="0" max="1" step=".01" value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <label className="block">Video volume <span className="float-right text-[#a8a8b5]">{muted ? 0 : Math.round(volume * 100)}%</span><input aria-label="Video volume" type="range" min="0" max="1" step=".01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mt-2 w-full accent-[#aa91ff]" /></label>
              </> : panel === "Adjust" ? <>
                <label className="block">Speed <span className="float-right">{speed}×</span><input aria-label="Playback speed" type="range" min=".25" max="2" step=".05" value={speed} onChange={(e) => { setSpeed(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <label className="block">Brightness <span className="float-right">{brightness}%</span><input aria-label="Brightness" type="range" min="50" max="150" value={brightness} onChange={(e) => { setBrightness(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <label className="block">Contrast <span className="float-right">{contrast}%</span><input aria-label="Contrast" type="range" min="50" max="150" value={contrast} onChange={(e) => { setContrast(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <label className="block">Opacity <span className="float-right">{opacity}%</span><input aria-label="Clip opacity" type="range" min="0" max="100" value={opacity} onChange={(e) => { setOpacity(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <div className="flex gap-2"><button type="button" onClick={() => { setRotation((rotation + 90) % 360); setSaved(false); }} className="flex-1 rounded-lg border border-[#383945] p-2 hover:bg-[#242530]"><RotateCw className="mx-auto mb-1 h-4 w-4" />Rotate</button><button type="button" onClick={() => { setFlip(!flip); setSaved(false); }} className="flex-1 rounded-lg border border-[#383945] p-2 hover:bg-[#242530]"><FlipHorizontal className="mx-auto mb-1 h-4 w-4" />Flip</button></div>
              </> : panel === "Text" ? <>
                <label className="block">Caption<input aria-label="Caption text" value={caption} onChange={(e) => { setCaption(e.target.value); setSaved(false); }} placeholder="Your caption here" className="mt-2 w-full rounded-lg border border-[#383945] bg-[#101116] px-3 py-2 outline-none focus:border-[#aa91ff]" /></label>
                <div className="flex items-center justify-between">Text color<input aria-label="Caption color" type="color" value={captionColor} onChange={(e) => setCaptionColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-[#383945] bg-transparent" /></div>
                <label className="block">Position<select aria-label="Caption position" value={captionPosition} onChange={(e) => setCaptionPosition(e.target.value as typeof captionPosition)} className="mt-2 w-full rounded-lg border border-[#383945] bg-[#101116] px-3 py-2"><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label>
              </> : <>
                <label className="block">Scale <span className="float-right">{clipScale}%</span><input aria-label="Clip scale" type="range" min="50" max="150" value={clipScale} onChange={(e) => setClipScale(Number(e.target.value))} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <label className="block">Rotate <span className="float-right">{rotation}°</span><input aria-label="Rotation" type="range" min="-180" max="180" value={rotation} onChange={(e) => { setRotation(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <label className="block">Opacity <span className="float-right">{opacity}%</span><input type="range" min="0" max="100" value={opacity} onChange={(e) => { setOpacity(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <div className="grid grid-cols-2 gap-2">{FILTERS.map((item) => <button key={item.name} type="button" onClick={() => { setFilter(item.css); setSaved(false); }} className={`rounded-lg border p-2 text-left ${filter === item.css ? "border-[#aa91ff] bg-[#252333]" : "border-[#383945] hover:bg-[#20212a]"}`}><span className="mb-2 block h-8 rounded bg-gradient-to-br from-[#416181] to-[#d5a679]" style={{ filter: item.css }} />{item.name}</button>)}</div>
              </>}
              {videoUrl && <div className="border-t border-[#30313b] pt-4">
                <div className="mb-3 flex items-center justify-between"><span className="font-semibold">Trim clip</span><span className="font-mono text-[#999aa8]">{fmt(trimStart)}–{fmt(trimEnd || duration)}</span></div>
                <label className="block text-[#aaaab6]">Start<input aria-label="Trim start" type="range" min="0" max={Math.max(0, (trimEnd || duration) - .25)} step=".1" value={trimStart} onChange={(e) => { setTrimStart(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
                <label className="mt-3 block text-[#aaaab6]">End<input aria-label="Trim end" type="range" min={Math.min(duration, trimStart + .25)} max={duration || 1} step=".1" value={trimEnd || duration} onChange={(e) => { setTrimEnd(Number(e.target.value)); setSaved(false); }} className="mt-2 w-full accent-[#aa91ff]" /></label>
              </div>}
            </div>
          </aside>
        </section>

        <section aria-label="Timeline" className="shrink-0 border-t border-[#292a34] bg-[#121319]">
          <div className="flex flex-wrap items-center gap-1 border-b border-[#292a34] px-3 py-2">
            <button type="button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(trimStart, current - 5); }} title="Back five seconds" className="rounded-lg px-2 py-2 text-xs text-[#aaaab6] hover:bg-[#282936]">−5s</button>
            <button type="button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(trimEnd || duration, current + 5); }} title="Forward five seconds" className="rounded-lg px-2 py-2 text-xs text-[#aaaab6] hover:bg-[#282936]">+5s</button>
            <button type="button" disabled={!videoUrl} onClick={() => { if (!videoRef.current || !duration) return; setTrimEnd(Math.max(trimStart + .25, current)); setSaved(false); }} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#c5c4d0] hover:bg-[#282936] disabled:opacity-40"><Scissors className="h-4 w-4" />Set end at playhead</button>
            <button type="button" onClick={() => { setCaption(""); setAudioUrl(null); setAudioName(""); setSaved(false); }} className="rounded-lg px-3 py-2 text-xs text-[#c5c4d0] hover:bg-[#282936]">Remove caption/audio</button>
            <span className="ml-auto text-xs text-[#888996]">{fmt(current)} / {fmt(duration)}</span>
          </div>
          <div className="space-y-1.5 overflow-x-auto px-3 py-3 sm:px-5">
            <div className="ml-[94px] flex min-w-[500px] justify-between pr-2 text-[10px] text-[#777987]">{Array.from({ length: 7 }, (_, i) => <span key={i}>{fmt(duration * i / 6)}</span>)}</div>
            <div className="flex min-w-[500px] items-center gap-2"><span className="w-[86px] shrink-0 text-xs text-[#a5a5b1]">Main video</span><div className="relative h-[52px] flex-1 overflow-hidden rounded-lg border border-[#545067] bg-gradient-to-r from-[#694e78] via-[#387f9a] to-[#bf8b55]" onClick={(e) => { if (!duration || !videoRef.current) return; const rect = e.currentTarget.getBoundingClientRect(); const time = ((e.clientX - rect.left) / rect.width) * duration; videoRef.current.currentTime = time; setCurrent(time); }}>
              {videoUrl ? <>{thumbs.length > 0 && <div className="absolute inset-0 grid grid-cols-8">{thumbs.map((src, idx) => <img key={idx} src={src} alt="" className="h-full w-full object-cover" />)}</div>}<div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent px-2.5 pb-1 text-[10px] font-medium text-white"><Film className="mr-1.5 h-3 w-3 shrink-0" /><span className="truncate">{videoName}</span></div><div className="absolute inset-y-0 border-x-2 border-[#c4a8ff] bg-[#aa91ff]/15" style={{ left: `${duration ? trimStart / duration * 100 : 0}%`, right: `${duration ? 100 - (trimEnd || duration) / duration * 100 : 0}%` }} /></> : <button type="button" onClick={() => fileRef.current?.click()} className="flex h-full w-full items-center justify-center gap-2 text-xs text-white/80"><ImagePlus className="h-4 w-4" />Import a video to fill the timeline</button>}
              <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_8px_#fff]" style={{ left: `${duration ? current / duration * 100 : 0}%` }} />
            </div></div>
            <div className="flex min-w-[500px] items-center gap-2"><span className="w-[86px] shrink-0 text-xs text-[#a5a5b1]">Text</span><div className="h-8 flex-1 overflow-hidden rounded-lg border border-[#37324e] bg-[#282341]">{caption && <div className="flex h-full items-center px-3 text-xs text-[#d0c0ff]">{caption}</div>}</div></div>
            <div className="flex min-w-[500px] items-center gap-2"><span className="w-[86px] shrink-0 text-xs text-[#a5a5b1]">Audio</span><div className="h-8 flex-1 overflow-hidden rounded-lg border border-[#24493f] bg-[#16352e]">{audioName && <div className="flex h-full items-center gap-2 px-3 text-xs text-emerald-200"><Music2 className="h-3.5 w-3.5" />{audioName}</div>}</div></div>
          </div>
        </section>
      </div>
    </main>
  );
}
