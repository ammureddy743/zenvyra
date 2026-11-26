from dataclasses import dataclass
from io import BytesIO
import math
import time
from typing import Literal

from PIL import Image, ImageEnhance

from app.services.image_generator import generate_image_from_prompt

MotionType = Literal["zoom-in", "zoom-out", "pan-left", "pan-right"]


@dataclass
class GeneratedVideoResult:
    video_bytes: bytes
    content_type: str
    width: int
    height: int
    duration_sec: int
    processing_ms: int


def _render_motion_frames(
    base_bytes: bytes,
    target_w: int,
    target_h: int,
    motion: MotionType,
    duration_sec: int,
    fps: int = 16,
) -> bytes:
    """Render smooth cinematic Ken Burns motion frames as an animated WebP."""
    img = Image.open(BytesIO(base_bytes)).convert("RGB")
    src_w, src_h = img.size

    # Ensure source has enough resolution headroom for smooth crop-pan/zoom
    upscale_w = max(src_w, int(target_w * 1.25))
    upscale_h = max(src_h, int(target_h * 1.25))
    if (src_w, src_h) != (upscale_w, upscale_h):
        img = img.resize((upscale_w, upscale_h), Image.Resampling.LANCZOS)
        src_w, src_h = img.size

    total_frames = max(24, min(fps * duration_sec, 80))
    frames: list[Image.Image] = []

    for i in range(total_frames):
        # Smooth ease-in-out progress
        raw_t = i / max(1, total_frames - 1)
        t = 0.5 - 0.5 * math.cos(math.pi * raw_t)

        if motion == "zoom-in":
            zoom = 1.0 + 0.18 * t
            cx, cy = src_w * 0.5, src_h * 0.5
        elif motion == "zoom-out":
            zoom = 1.18 - 0.18 * t
            cx, cy = src_w * 0.5, src_h * 0.5
        elif motion == "pan-left":
            zoom = 1.16
            cx = src_w * (0.56 - 0.12 * t)
            cy = src_h * 0.5
        else:  # pan-right
            zoom = 1.16
            cx = src_w * (0.44 + 0.12 * t)
            cy = src_h * 0.5

        crop_w = min(src_w, src_w / zoom)
        crop_h = min(src_h, crop_w * (target_h / target_w))
        if crop_h > src_h:
            crop_h = src_h
            crop_w = crop_h * (target_w / target_h)

        left = max(0.0, min(src_w - crop_w, cx - crop_w / 2.0))
        top = max(0.0, min(src_h - crop_h, cy - crop_h / 2.0))

        frame = img.crop((left, top, left + crop_w, top + crop_h)).resize(
            (target_w, target_h), Image.Resampling.BILINEAR
        )

        # Subtle atmospheric brightness pulse
        pulse = 1.0 + 0.03 * math.sin(math.pi * raw_t)
        frame = ImageEnhance.Brightness(frame).enhance(pulse)
        frames.append(frame)

    out = BytesIO()
    frame_ms = int(1000 / fps)
    frames[0].save(
        out,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=frame_ms,
        loop=0,
        quality=82,
        method=4,
    )
    return out.getvalue()


async def generate_video_from_prompt(
    prompt: str,
    style: str = "photorealistic",
    motion: MotionType = "zoom-in",
    duration_sec: int = 3,
    width: int = 768,
    height: int = 432,
) -> GeneratedVideoResult:
    """Generate an animated motion video from a text prompt."""
    started = time.perf_counter()

    safe_duration = 5 if duration_sec >= 5 else 3
    safe_w = max(512, min(width, 960))
    safe_h = max(384, min(height, 960))

    # Generate high-resolution base scene first
    base = await generate_image_from_prompt(
        prompt=prompt,
        style=style,
        width=max(768, safe_w),
        height=max(512, safe_h),
    )

    video_bytes = _render_motion_frames(
        base_bytes=base.image_bytes,
        target_w=safe_w,
        target_h=safe_h,
        motion=motion,
        duration_sec=safe_duration,
    )

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return GeneratedVideoResult(
        video_bytes=video_bytes,
        content_type="image/webp",
        width=safe_w,
        height=safe_h,
        duration_sec=safe_duration,
        processing_ms=elapsed_ms,
    )
