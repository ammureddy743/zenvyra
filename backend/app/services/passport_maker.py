from dataclasses import dataclass
from io import BytesIO
import time
from typing import Literal

import numpy as np
from PIL import Image, ImageOps

from app.services.bg_remover import get_rembg_session

PassportPreset = Literal["us-2x2", "eu-35x45", "uk-35x45", "india-35x45"]
ExportFormat = Literal["png", "jpeg"]

PASSPORT_SIZES: dict[PassportPreset, tuple[int, int]] = {
    "us-2x2": (600, 600),       # 2x2 inches @ 300 DPI
    "eu-35x45": (413, 531),     # 35x45 mm @ 300 DPI
    "uk-35x45": (413, 531),     # 35x45 mm @ 300 DPI
    "india-35x45": (413, 531),  # 35x45 mm @ 300 DPI
}


@dataclass
class PassportPhotoResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    processing_ms: int


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


def process_passport_photo(
    raw_bytes: bytes,
    preset: PassportPreset = "us-2x2",
    bg_color: str = "#ffffff",
    printable_sheet: bool = False,
    export_format: ExportFormat = "png",
) -> PassportPhotoResult:
    """Remove background, auto-crop to official passport dimensions, and optionally tile 4x6 sheet."""
    from rembg import remove

    started = time.perf_counter()

    original = ImageOps.exif_transpose(Image.open(BytesIO(raw_bytes))).convert("RGBA")
    session = get_rembg_session("isnet-general-use")
    cutout = remove(original, session=session)
    if isinstance(cutout, Image.Image):
        cutout = cutout.convert("RGBA")
    elif isinstance(cutout, np.ndarray):
        cutout = Image.fromarray(cutout).convert("RGBA")
    else:
        cutout = Image.open(BytesIO(cutout)).convert("RGBA")

    # Find foreground bounding box so subject is centered with proper headroom
    alpha = np.array(cutout)[:, :, 3]
    ys, xs = np.where(alpha > 32)

    target_w, target_h = PASSPORT_SIZES[preset]
    if len(xs) > 0 and len(ys) > 0:
        x_min, x_max = int(xs.min()), int(xs.max())
        y_min, y_max = int(ys.min()), int(ys.max())
        fg_w = max(1, x_max - x_min)
        fg_h = max(1, y_max - y_min)

        # Pad top by 18% of subject height for compliant headroom
        pad_top = int(fg_h * 0.18)
        crop_top = max(0, y_min - pad_top)
        # Focus on upper torso/head (up to 65% of subject height or full if short)
        crop_bottom = min(cutout.height, y_min + int(fg_h * 0.72))
        crop_h = max(1, crop_bottom - crop_top)
        desired_aspect = target_w / target_h
        crop_w = int(crop_h * desired_aspect)

        cx = (x_min + x_max) // 2
        crop_left = max(0, min(cutout.width - crop_w, cx - crop_w // 2))
        crop_right = min(cutout.width, crop_left + crop_w)
        if crop_right - crop_left < crop_w:
            crop_left = max(0, crop_right - crop_w)

        cropped = cutout.crop((crop_left, crop_top, crop_right, crop_bottom))
    else:
        cropped = ImageOps.fit(cutout, (target_w, target_h), Image.Resampling.LANCZOS)

    fitted = ImageOps.fit(cropped, (target_w, target_h), Image.Resampling.LANCZOS)
    bg_rgb = _parse_hex_color(bg_color)
    single_photo = Image.new("RGB", (target_w, target_h), bg_rgb)
    single_photo.paste(fitted, mask=fitted.split()[3])

    if printable_sheet:
        # 4x6 inch printable sheet @ 300 DPI (1800 x 1200 px)
        sheet = Image.new("RGB", (1800, 1200), (245, 245, 245))
        cols = max(1, 1720 // (target_w + 30))
        rows = max(1, 1120 // (target_h + 30))
        margin_x = (1800 - (cols * target_w + (cols - 1) * 30)) // 2
        margin_y = (1200 - (rows * target_h + (rows - 1) * 30)) // 2
        for r in range(rows):
            for c in range(cols):
                px = margin_x + c * (target_w + 30)
                py = margin_y + r * (target_h + 30)
                sheet.paste(single_photo, (px, py))
        output_img = sheet
    else:
        output_img = single_photo

    out_buffer = BytesIO()
    if export_format == "jpeg":
        output_img.save(out_buffer, format="JPEG", quality=96, subsampling=0, optimize=True)
        content_type = "image/jpeg"
    else:
        output_img.save(out_buffer, format="PNG", compress_level=3)
        content_type = "image/png"

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return PassportPhotoResult(
        image_bytes=out_buffer.getvalue(),
        content_type=content_type,
        width=output_img.width,
        height=output_img.height,
        processing_ms=elapsed_ms,
    )
