from dataclasses import dataclass
from io import BytesIO
import time
from typing import Literal

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps, UnidentifiedImageError

CropPreset = Literal["original", "square", "portrait", "landscape"]
ExportFormat = Literal["png", "jpeg"]
MAX_EDIT_PIXELS = 40_000_000
CROP_RATIOS: dict[str, float] = {
    "square": 1.0,
    "portrait": 4 / 5,
    "landscape": 16 / 9,
}


@dataclass
class PhotoEditResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    processing_ms: int


def _caption_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for font_path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ):
        try:
            return ImageFont.truetype(font_path, size=size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


def process_photo_edit(
    raw_bytes: bytes,
    *,
    rotation: int = 0,
    crop: CropPreset = "original",
    brightness: int = 100,
    contrast: int = 100,
    saturation: int = 100,
    text: str = "",
    export_format: ExportFormat = "png",
) -> PhotoEditResult:
    """Apply the browser editor's photo controls and return an exported image."""
    started = time.perf_counter()
    with Image.open(BytesIO(raw_bytes)) as opened:
        image = ImageOps.exif_transpose(opened).copy()

    if image.width * image.height > MAX_EDIT_PIXELS:
        raise ValueError("Image dimensions are too large to edit safely.")
    if image.width < 1 or image.height < 1:
        raise UnidentifiedImageError("Image has no pixels.")

    has_alpha = "A" in image.getbands()
    image = image.convert("RGBA" if has_alpha else "RGB")

    if rotation not in (0, 90, 180, 270):
        raise ValueError("Rotation must be 0, 90, 180, or 270 degrees.")
    if rotation:
        image = image.rotate(-rotation, expand=True, resample=Image.Resampling.BICUBIC)

    if crop != "original":
        target_ratio = CROP_RATIOS[crop]
        width, height = image.size
        if width / height > target_ratio:
            crop_width = round(height * target_ratio)
            left = (width - crop_width) // 2
            image = image.crop((left, 0, left + crop_width, height))
        else:
            crop_height = round(width / target_ratio)
            top = (height - crop_height) // 2
            image = image.crop((0, top, width, top + crop_height))

    alpha = image.getchannel("A") if has_alpha else None
    adjusted = image.convert("RGB")
    adjusted = ImageEnhance.Brightness(adjusted).enhance(max(50, min(brightness, 150)) / 100)
    adjusted = ImageEnhance.Contrast(adjusted).enhance(max(50, min(contrast, 150)) / 100)
    adjusted = ImageEnhance.Color(adjusted).enhance(max(0, min(saturation, 200)) / 100)
    if alpha is not None:
        image = adjusted.convert("RGBA")
        image.putalpha(alpha)
    else:
        image = adjusted

    caption = text.strip()[:80]
    if caption:
        draw = ImageDraw.Draw(image)
        font_size = max(20, round(image.width * 0.055))
        font = _caption_font(font_size)
        max_text_width = image.width * 0.9
        while font_size > 12 and draw.textbbox((0, 0), caption, font=font, stroke_width=2)[2] > max_text_width:
            font_size -= 2
            font = _caption_font(font_size)
        x = image.width / 2
        y = image.height - round(font_size * 0.65)
        draw.text(
            (x, y),
            caption,
            font=font,
            anchor="ms",
            fill=(255, 255, 255, 255) if image.mode == "RGBA" else (255, 255, 255),
            stroke_width=max(2, round(font_size * 0.14)),
            stroke_fill=(0, 0, 0, 190) if image.mode == "RGBA" else (0, 0, 0),
        )

    output = BytesIO()
    if export_format == "jpeg":
        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, "white")
            background.paste(image, mask=image.getchannel("A"))
            image = background
        image.save(output, format="JPEG", quality=94, optimize=True, subsampling=0)
        content_type = "image/jpeg"
    else:
        image.save(output, format="PNG", compress_level=6)
        content_type = "image/png"

    return PhotoEditResult(
        image_bytes=output.getvalue(),
        content_type=content_type,
        width=image.width,
        height=image.height,
        processing_ms=int((time.perf_counter() - started) * 1000),
    )
