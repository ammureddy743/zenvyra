"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  RotateCw,
  RotateCcw,
  SlidersHorizontal,
  Type,
  Undo2,
  Redo2,
} from "lucide-react";

type CropPreset = "original" | "square" | "portrait" | "landscape";
type PhotoSettings = {
  rotation: number;
  crop: CropPreset;
  brightness: number;
  contrast: number;
  saturation: number;
  text: string;
};

const DEFAULT_SETTINGS: PhotoSettings = {
  rotation: 0,
  crop: "original",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  text: "",
};
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MAX_PIXEL_COUNT = 40_000_000;
const CROP_RATIOS: Record<Exclude<CropPreset, "original">, number> = {
  square: 1,
  portrait: 4 / 5,
  landscape: 16 / 9,
};

function renderPhoto(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  settings: PhotoSettings,
  maxDimension = Number.POSITIVE_INFINITY
) {
  const previewScale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const sourceWidth = image.naturalWidth * previewScale;
  const sourceHeight = image.naturalHeight * previewScale;
  const sideways = settings.rotation % 180 !== 0;
  const rotatedWidth = sideways ? sourceHeight : sourceWidth;
  const rotatedHeight = sideways ? sourceWidth : sourceHeight;
  const rotated = document.createElement("canvas");
  rotated.width = rotatedWidth;
  rotated.height = rotatedHeight;
  const rotatedContext = rotated.getContext("2d");
  if (!rotatedContext) return;

  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate((settings.rotation * Math.PI) / 180);
  rotatedContext.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);

  let cropWidth = rotatedWidth;
  let cropHeight = rotatedHeight;
  if (settings.crop !== "original") {
    const ratio = CROP_RATIOS[settings.crop];
    if (rotatedWidth / rotatedHeight > ratio) cropWidth = rotatedHeight * ratio;
    else cropHeight = rotatedWidth / ratio;
  }
  const cropX = (rotatedWidth - cropWidth) / 2;
  const cropY = (rotatedHeight - cropHeight) / 2;
  const scale = Math.min(1, maxDimension / Math.max(cropWidth, cropHeight));
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) return;
  context.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  context.drawImage(rotated, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  context.filter = "none";

  const text = settings.text.trim();
  if (text) {
    const fontSize = Math.max(20, Math.round(canvas.width * 0.055));
    context.font = `600 ${fontSize}px system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.lineJoin = "round";
    context.lineWidth = Math.max(3, fontSize * 0.14);
    context.strokeStyle = "rgba(0, 0, 0, 0.72)";
    context.fillStyle = "#ffffff";
    context.strokeText(text, canvas.width / 2, canvas.height - fontSize * 0.65, canvas.width * 0.9);
    context.fillText(text, canvas.width / 2, canvas.height - fontSize * 0.65, canvas.width * 0.9);
  }
}

export function PhotoEditorStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const historyRef = useRef<PhotoSettings[]>([DEFAULT_SETTINGS]);
  const historyIndexRef = useRef(0);
  const [fileName, setFileName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth * image.naturalHeight > MAX_PIXEL_COUNT) {
        setError("This image is too large to edit in a browser. Resize it and try again.");
        return;
      }
      setError("");
      imageRef.current = image;
      if (canvasRef.current) renderPhoto(canvasRef.current, image, settingsRef.current, 1800);
    };
    image.onerror = () => setError("This image could not be opened. Try a JPG, PNG, or WebP file.");
    image.src = imageUrl;
    return () => {
      imageRef.current = null;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (canvasRef.current && imageRef.current) {
      renderPhoto(canvasRef.current, imageRef.current, settings, 1800);
    }
  }, [settings]);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const chooseFile = (file?: File) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError("");
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Images must be 30 MB or smaller.");
      return;
    }
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setSettings(DEFAULT_SETTINGS);
    historyRef.current = [DEFAULT_SETTINGS];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setImageUrl(URL.createObjectURL(file));
  };

  const updateSettings = (changes: Partial<PhotoSettings>) => {
    const next = { ...settings, ...changes };
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(next);
    if (history.length > 50) history.shift();
    historyRef.current = history;
    historyIndexRef.current = history.length - 1;
    setSettings(next);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setSettings(historyRef.current[historyIndexRef.current]);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setSettings(historyRef.current[historyIndexRef.current]);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  const exportPhoto = () => {
    const image = imageRef.current;
    if (!image) return;
    const output = document.createElement("canvas");
    renderPhoto(output, image, settings);
    output.toBlob((blob) => {
      if (!blob) {
        setError("Could not export this image. Try a smaller file.");
        return;
      }
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${fileName || "zenvyra-edit"}.${format === "jpeg" ? "jpg" : "png"}`;
      link.click();
      URL.revokeObjectURL(url);
    }, format === "jpeg" ? "image/jpeg" : "image/png", 0.94);
  };

  const resetSettings = () => updateSettings(DEFAULT_SETTINGS);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="photo-editor-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">Everyday photo editing</p>
          <h1 id="photo-editor-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Photo Editor</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">Crop, rotate, tune color, and add a caption. Your original stays untouched.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={undo} disabled={!canUndo} className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium disabled:opacity-40 dark:border-zinc-800" aria-label="Undo edit"><Undo2 className="h-4 w-4" /> Undo</button>
          <button type="button" onClick={redo} disabled={!canRedo} className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium disabled:opacity-40 dark:border-zinc-800" aria-label="Redo edit"><Redo2 className="h-4 w-4" /> Redo</button>
        </div>
      </div>

      {!imageUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]); }}
          className={`flex min-h-[340px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition ${isDragging ? "border-violet-500 bg-violet-500/10" : "border-zinc-300 bg-white hover:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900/50"}`}
        >
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><ImagePlus className="h-8 w-8" /></span>
          <span className="mt-5 text-lg font-semibold">Drop a photo to get started</span>
          <span className="mt-2 text-sm text-zinc-500">JPG, PNG, or WebP · up to 30 MB</span>
          <span className="mt-5 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">Choose a photo</span>
        </button>
      ) : (
        <div className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-[440px] sm:min-h-[540px] flex-col bg-checkerboard">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white/85 px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/85">
              <span className="max-w-[60%] truncate font-medium text-zinc-700 dark:text-zinc-200">{fileName}</span>
              <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-violet-700 hover:text-violet-500 dark:text-violet-300">Replace image</button>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
            </div>
            <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
              <canvas ref={canvasRef} className="h-full max-h-[65vh] w-full object-contain rounded-lg shadow-2xl" aria-label="Edited photo preview" />
            </div>
          </div>

          <aside className="space-y-5 border-t border-zinc-200 p-5 dark:border-zinc-800 lg:border-l lg:border-t-0">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4 text-violet-600" /> Crop &amp; transform</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["original", "square", "portrait", "landscape"] as const).map((crop) => (
                  <button key={crop} type="button" aria-pressed={settings.crop === crop} onClick={() => updateSettings({ crop })} className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize ${settings.crop === crop ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" : "border-zinc-200 dark:border-zinc-800"}`}>{crop === "original" ? "Original ratio" : crop}</button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => updateSettings({ rotation: (settings.rotation + 270) % 360 })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2 text-xs font-medium dark:border-zinc-800"><RotateCcw className="h-3.5 w-3.5" /> Rotate left</button>
                <button type="button" onClick={() => updateSettings({ rotation: (settings.rotation + 90) % 360 })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2 text-xs font-medium dark:border-zinc-800"><RotateCw className="h-3.5 w-3.5" /> Rotate right</button>
              </div>
            </div>

            <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold">Light &amp; color</h2>
              {([
                ["Brightness", "brightness", 50, 150],
                ["Contrast", "contrast", 50, 150],
                ["Saturation", "saturation", 0, 200],
              ] as const).map(([label, key, min, max]) => (
                <label key={key} className="block text-xs">
                  <span className="mb-1 flex justify-between"><span>{label}</span><span className="font-mono text-zinc-500">{settings[key]}%</span></span>
                  <input type="range" min={min} max={max} value={settings[key]} onChange={(event) => updateSettings({ [key]: Number(event.target.value) })} className="w-full accent-violet-600" aria-label={label} />
                </label>
              ))}
            </div>

            <label className="block border-t border-zinc-200 pt-4 text-sm font-semibold dark:border-zinc-800">
              <span className="flex items-center gap-2"><Type className="h-4 w-4 text-violet-600" /> Add a caption</span>
              <input value={settings.text} onChange={(event) => updateSettings({ text: event.target.value })} maxLength={80} placeholder="Type text for your photo" className="mt-3 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs font-normal outline-none focus:border-violet-500 dark:border-zinc-700" />
            </label>

            <div className="grid grid-cols-2 gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              {(["png", "jpeg"] as const).map((item) => <button key={item} type="button" aria-pressed={format === item} onClick={() => setFormat(item)} className={`rounded-xl border py-2 text-xs font-semibold uppercase ${format === item ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" : "border-zinc-200 dark:border-zinc-800"}`}>{item === "png" ? "PNG" : "JPEG"}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={resetSettings} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-3 text-xs font-semibold dark:border-zinc-800"><RotateCcw className="h-4 w-4" /> Reset edits</button>
              <button type="button" onClick={exportPhoto} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-semibold text-white transition hover:bg-violet-500"><Download className="h-4 w-4" /> Export photo</button>
            </div>
          </aside>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
    </section>
  );
}
