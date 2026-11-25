from dataclasses import dataclass
from io import BytesIO
import time
from typing import Literal

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ExportFormat = Literal["png", "jpeg"]


@dataclass
class PhotoRestoreResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    processing_ms: int


def _apply_natural_colorization(rgb_arr: np.ndarray) -> np.ndarray:
    """Apply subtle warm/natural tinting when restoring monochrome/faded photos."""
    luminance = (
        0.299 * rgb_arr[:, :, 0]
        + 0.587 * rgb_arr[:, :, 1]
        + 0.114 * rgb_arr[:, :, 2]
    )
    # Blend warm midtones and cool shadows for natural vintage color recovery
    r = np.clip(luminance * 1.06 + 8.0 * (1.0 - luminance / 255.0), 0, 255)
    g = np.clip(luminance * 1.01 + 3.0 * (luminance / 255.0), 0, 255)
    b = np.clip(luminance * 0.94 + 12.0 * (1.0 - luminance / 255.0), 0, 255)
    colored = np.stack([r, g, b], axis=-1)
    # Preserve existing color if photo already has saturation
    max_c = np.max(rgb_arr, axis=-1, keepdims=True)
    min_c = np.min(rgb_arr, axis=-1, keepdims=True)
    sat = (max_c - min_c) / np.maximum(max_c, 1.0)
    blend = np.clip(1.0 - sat * 2.5, 0.2, 1.0)
    return np.clip(rgb_arr * (1.0 - blend) + colored * blend, 0, 255)


def process_photo_restoration(
    raw_bytes: bytes,
    enhance_details: bool = True,
    colorize: bool = False,
    denoise_strength: float = 1.0,
    export_format: ExportFormat = "png",
) -> PhotoRestoreResult:
    """Restore faded, noisy, or low-contrast photos at full resolution."""
    from scipy.ndimage import median_filter  # pyrefly: ignore[untyped-import]
    from skimage.exposure import equalize_adapthist

    started = time.perf_counter()

    original = ImageOps.exif_transpose(Image.open(BytesIO(raw_bytes))).convert("RGB")
    arr = np.array(original, dtype=np.float32)

    # 1. Remove dust/speckle noise
    if denoise_strength > 0:
        size = 3 if denoise_strength <= 1.5 else 5
        for c in range(3):
            denoised_c = median_filter(arr[:, :, c], size=size)
            alpha = min(float(denoise_strength), 2.0) * 0.35
            arr[:, :, c] = arr[:, :, c] * (1.0 - alpha) + denoised_c * alpha

    # 2. Local adaptive contrast restoration (recovers faded highlights/shadows)
    norm = np.clip(arr / 255.0, 0.0, 1.0)
    clahe = equalize_adapthist(norm, clip_limit=0.015) * 255.0
    arr = np.clip(arr * 0.55 + clahe * 0.45, 0, 255)

    # 3. Optional colorization
    if colorize:
        arr = _apply_natural_colorization(arr)

    restored = Image.fromarray(arr.astype(np.uint8), mode="RGB")

    # 4. Crisp detail & portrait clarity enhancement
    if enhance_details:
        restored = restored.filter(
            ImageFilter.UnsharpMask(radius=1.5, percent=115, threshold=2)
        )
        restored = ImageEnhance.Contrast(restored).enhance(1.06)

    out_buffer = BytesIO()
    if export_format == "jpeg":
        restored.save(out_buffer, format="JPEG", quality=96, subsampling=0, optimize=True)
        content_type = "image/jpeg"
    else:
        restored.save(out_buffer, format="PNG", compress_level=3)
        content_type = "image/png"

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return PhotoRestoreResult(
        image_bytes=out_buffer.getvalue(),
        content_type=content_type,
        width=restored.width,
        height=restored.height,
        processing_ms=elapsed_ms,
    )
