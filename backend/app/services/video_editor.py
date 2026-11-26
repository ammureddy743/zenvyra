from dataclasses import dataclass
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from typing import Literal

AspectRatio = Literal["original", "16:9", "9:16", "1:1"]
MAX_CLIP_SECONDS = 120


@dataclass
class VideoEditResult:
    video_bytes: bytes
    processing_ms: int
    duration_seconds: float


def _video_filter(aspect_ratio: AspectRatio) -> str:
    if aspect_ratio == "16:9":
        return (
            "crop=w='min(iw,ih*16/9)':h='min(ih,iw*9/16)':"
            "x='(iw-ow)/2':y='(ih-oh)/2',scale=1280:720"
        )
    if aspect_ratio == "9:16":
        return (
            "crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)':"
            "x='(iw-ow)/2':y='(ih-oh)/2',scale=720:1280"
        )
    if aspect_ratio == "1:1":
        return (
            "crop=w='min(iw,ih)':h='min(iw,ih)':"
            "x='(iw-ow)/2':y='(ih-oh)/2',scale=1080:1080"
        )
    return (
        "scale=w='min(1280,iw)':h='min(1280,ih)':"
        "force_original_aspect_ratio=decrease:force_divisible_by=2"
    )


def process_video_edit(
    raw_bytes: bytes,
    *,
    filename: str,
    start_seconds: float,
    end_seconds: float,
    aspect_ratio: AspectRatio,
    temp_dir: Path,
) -> VideoEditResult:
    """Trim and center-crop a video with FFmpeg, retaining its source audio."""
    started = time.perf_counter()
    duration = end_seconds - start_seconds
    if start_seconds < 0 or duration < 0.2 or duration > MAX_CLIP_SECONDS:
        raise ValueError("Choose a valid clip segment up to two minutes long.")
    if not raw_bytes:
        raise ValueError("Uploaded video is empty.")

    ffmpeg = shutil.which(os.getenv("FFMPEG_BINARY", "ffmpeg"))
    if not ffmpeg:
        raise FileNotFoundError("FFmpeg is not installed on the editing server.")

    suffix = Path(filename).suffix.lower()
    if suffix not in {".mp4", ".webm", ".mov"}:
        suffix = ".mp4"

    with tempfile.TemporaryDirectory(prefix="zenvyra-video-edit-", dir=temp_dir) as work_dir:
        input_path = Path(work_dir) / f"source{suffix}"
        output_path = Path(work_dir) / "edited.mp4"
        input_path.write_bytes(raw_bytes)
        command = [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            f"{start_seconds:.3f}",
            "-i",
            str(input_path),
            "-t",
            f"{duration:.3f}",
            "-map",
            "0:v:0",
            "-map",
            "0:a:0?",
            "-vf",
            _video_filter(aspect_ratio),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "22",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            "-avoid_negative_ts",
            "make_zero",
            "-shortest",
            str(output_path),
        ]
        try:
            result = subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
                timeout=600,
            )
        except subprocess.TimeoutExpired as exc:
            raise TimeoutError("Video export took too long. Try a shorter clip.") from exc
        except subprocess.CalledProcessError as exc:
            details = (exc.stderr or "").strip()[-1200:]
            raise ValueError(details or "The uploaded video could not be processed.") from exc

        if not output_path.exists():
            raise ValueError("Video export did not produce an output file.")
        output_bytes = output_path.read_bytes()

    return VideoEditResult(
        video_bytes=output_bytes,
        processing_ms=int((time.perf_counter() - started) * 1000),
        duration_seconds=duration,
    )
