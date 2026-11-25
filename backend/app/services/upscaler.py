from dataclasses import dataclass
from io import BytesIO
import time
from typing import Literal

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ExportFormat = Literal["png", "jpeg"]


@dataclass
class UpscaleResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    scale: int
    processing_ms: int


def process_upscale(
    raw_bytes: bytes,
    scale: Literal[2, 4] = 2,
    sharpen: float = 1.2,
    denoise: float = 0.0,
    export_format: ExportFormat = "png",
) -> UpscaleResult:
    """Upscale image at full quality with optional denoising and detail sharpening."""
    started = time.perf_counter()

    original = ImageOps.exif_transpose(Image.open(BytesIO(raw_bytes)))
    has_alpha = original.mode in ("RGBA", "LA") or (
        original.mode == "P" and "transparency" in original.info
    )
    working = original.convert("RGBA" if has_alpha else "RGB")

    # Optional gentle denoise before upscaling
    if denoise > 0:
        from scipy.ndimage import gaussian_filter  # pyrefly: ignore[untyped-import]

        arr = np.array(working, dtype=np.float32)
        sigma = min(float(denoise), 3.0) * 0.45
        for c in range(3):
            arr[:, :, c] = gaussian_filter(arr[:, :, c], sigma=sigma)
        working = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode=working.mode)

    target_w = working.width * scale
    target_h = working.height * scale

    # Cap extreme dimensions to prevent OOM on massive inputs
    max_dim = 8192
    if max(target_w, target_h) > max_dim:
        ratio = max_dim / max(target_w, target_h)
        target_w = max(1, int(target_w * ratio))
        target_h = max(1, int(target_h * ratio))

    upscaled = working.resize((target_w, target_h), Image.Resampling.LANCZOS)

    if sharpen > 0:
        percent = int(min(max(sharpen, 0.0), 3.0) * 90)
        if upscaled.mode == "RGBA":
            r, g, b, a = upscaled.split()
            rgb = Image.merge("RGB", (r, g, b)).filter(
                ImageFilter.UnsharpMask(radius=1.4, percent=percent, threshold=2)
            )
            r2, g2, b2 = rgb.split()
            upscaled = Image.merge("RGBA", (r2, g2, b2, a))
        else:
            upscaled = upscaled.filter(
                ImageFilter.UnsharpMask(radius=1.4, percent=percent, threshold=2)
            )

    out_buffer = BytesIO()
    if export_format == "jpeg":
        rgb_out = upscaled.convert("RGB")
        rgb_out.save(out_buffer, format="JPEG", quality=96, subsampling=0, optimize=True)
        content_type = "image/jpeg"
    else:
        upscaled.save(out_buffer, format="PNG", compress_level=3)
        content_type = "image/png"

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return UpscaleResult(
        image_bytes=out_buffer.getvalue(),
        content_type=content_type,
        width=upscaled.width,
        height=upscaled.height,
        scale=scale,
        processing_ms=elapsed_ms,
    )
