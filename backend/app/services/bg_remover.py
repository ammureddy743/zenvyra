from dataclasses import dataclass
from io import BytesIO
import time
from typing import TYPE_CHECKING, Literal

import numpy as np
from PIL import Image, ImageFilter, ImageOps

if TYPE_CHECKING:
    from rembg.sessions.base import BaseSession

AllowedModel = Literal["birefnet-general", "isnet-general-use"]
ExportFormat = Literal["png", "jpeg"]

SUPPORTED_MODELS: dict[str, str] = {
    "birefnet-general": "BiRefNet General (Best detail & hair)",
    "isnet-general-use": "IS-Net General Use (Fast & crisp edges)",
}

_SESSION_CACHE: dict[str, "BaseSession"] = {}


@dataclass
class BgRemovalResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    model_used: str
    quality_warning: str | None
    processing_ms: int


def get_rembg_session(model_name: AllowedModel) -> "BaseSession":
    """Lazily initialize and cache the ONNX session per model."""
    if model_name not in _SESSION_CACHE:
        from rembg import new_session

        _SESSION_CACHE[model_name] = new_session(model_name)
    return _SESSION_CACHE[model_name]


def _assess_input_quality(width: int, height: int, file_bytes: int) -> str | None:
    min_dim = min(width, height)
    if min_dim < 400:
        return (
            f"Low resolution input ({width}x{height}px). "
            "For best edge accuracy, use an image at least 600px on its shortest side."
        )
    if file_bytes < 25_000 and min_dim < 800:
        return (
            f"Heavily compressed or small input ({width}x{height}px, {file_bytes // 1024} KB). "
            "Fine details like hair may appear soft."
        )
    return None


def _refine_alpha_channel(
    rgba_image: Image.Image,
    feather: float = 0.0,
    smooth: float = 0.0,
    shift_edge: int = 0,
) -> Image.Image:
    """Apply non-destructive edge refinement to the alpha matte only."""
    if feather == 0 and smooth == 0 and shift_edge == 0:
        return rgba_image

    from scipy.ndimage import (  # pyrefly: ignore[untyped-import]
        binary_dilation,
        binary_erosion,
        gaussian_filter,
    )

    arr = np.array(rgba_image, dtype=np.uint8)
    alpha = arr[:, :, 3].astype(np.float32) / 255.0

    # Shift edge: positive expands foreground, negative contracts foreground
    if shift_edge != 0:
        iterations = min(abs(shift_edge), 15)
        mask = alpha > 0.5
        if shift_edge > 0:
            dilated = binary_dilation(mask, iterations=iterations)
            alpha = np.where(dilated & (alpha < 1.0), np.maximum(alpha, 0.85), alpha)
        else:
            eroded = binary_erosion(mask, iterations=iterations)
            alpha = np.where(~eroded, np.minimum(alpha, 0.0), alpha)

    # Smooth: softens jagged mask transitions before feathering
    if smooth > 0:
        sigma = min(float(smooth), 10.0) * 0.6
        alpha = gaussian_filter(alpha, sigma=sigma)

    arr[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    refined = Image.fromarray(arr, mode="RGBA")

    # Feather: soft outer falloff
    if feather > 0:
        r, g, b, a = refined.split()
        a = a.filter(ImageFilter.GaussianBlur(radius=min(float(feather), 20.0) * 0.5))
        refined = Image.merge("RGBA", (r, g, b, a))

    return refined


def _parse_hex_color(hex_color: str) -> tuple[int, int, int]:
    cleaned = hex_color.strip().lstrip("#")
    if len(cleaned) != 6:
        return (255, 255, 255)
    try:
        return (
            int(cleaned[0:2], 16),
            int(cleaned[2:4], 16),
            int(cleaned[4:6], 16),
        )
    except ValueError:
        return (255, 255, 255)


def process_background_removal(
    raw_bytes: bytes,
    model_name: AllowedModel = "birefnet-general",
    export_format: ExportFormat = "png",
    bg_color: str = "#ffffff",
    feather: float = 0.0,
    smooth: float = 0.0,
    shift_edge: int = 0,
) -> BgRemovalResult:
    """Remove background at full resolution without modifying or compressing the original."""
    started = time.perf_counter()

    # Load original image without re-compressing it; respect EXIF orientation
    original = Image.open(BytesIO(raw_bytes))
    original = ImageOps.exif_transpose(original)
    width, height = original.size
    quality_warning = _assess_input_quality(width, height, len(raw_bytes))

    if original.mode != "RGBA":
        working_img = original.convert("RGBA")
    else:
        working_img = original.copy()

    from rembg import remove

    session = get_rembg_session(model_name)
    cutout = remove(working_img, session=session)
    if isinstance(cutout, Image.Image):
        cutout = cutout.convert("RGBA")
    elif isinstance(cutout, np.ndarray):
        cutout = Image.fromarray(cutout).convert("RGBA")
    else:
        cutout = Image.open(BytesIO(cutout)).convert("RGBA")

    cutout = _refine_alpha_channel(
        cutout,
        feather=feather,
        smooth=smooth,
        shift_edge=shift_edge,
    )

    out_buffer = BytesIO()
    if export_format == "jpeg":
        rgb_bg = Image.new("RGB", cutout.size, _parse_hex_color(bg_color))
        rgb_bg.paste(cutout, mask=cutout.split()[3])
        rgb_bg.save(out_buffer, format="JPEG", quality=96, subsampling=0, optimize=True)
        content_type = "image/jpeg"
    else:
        cutout.save(out_buffer, format="PNG", compress_level=3)
        content_type = "image/png"

    elapsed_ms = int((time.perf_counter() - started) * 1000)

    return BgRemovalResult(
        image_bytes=out_buffer.getvalue(),
        content_type=content_type,
        width=width,
        height=height,
        model_used=model_name,
        quality_warning=quality_warning,
        processing_ms=elapsed_ms,
    )
