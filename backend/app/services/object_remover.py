from dataclasses import dataclass
from io import BytesIO
import time
from typing import Literal

import numpy as np
from PIL import Image, ImageOps

ExportFormat = Literal["png", "jpeg"]


@dataclass
class ObjectRemovalResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    processing_ms: int


def process_object_removal(
    raw_bytes: bytes,
    mask_bytes: bytes,
    export_format: ExportFormat = "png",
) -> ObjectRemovalResult:
    """Inpaint masked region while preserving all unmasked pixels at full resolution."""
    from skimage.restoration import inpaint_biharmonic

    started = time.perf_counter()

    original = ImageOps.exif_transpose(Image.open(BytesIO(raw_bytes))).convert("RGB")
    mask_img = Image.open(BytesIO(mask_bytes)).convert("L")

    if mask_img.size != original.size:
        mask_img = mask_img.resize(original.size, Image.Resampling.NEAREST)

    orig_arr = np.array(original, dtype=np.float32) / 255.0
    mask_arr = np.array(mask_img, dtype=np.uint8) > 32

    if not np.any(mask_arr):
        result_img = original
    else:
        # For large images, compute biharmonic inpainting on a bounded proxy and blend back
        max_side = max(original.width, original.height)
        if max_side > 1024:
            scale = 1024 / max_side
            small_size = (
                max(1, int(original.width * scale)),
                max(1, int(original.height * scale)),
            )
            small_img = original.resize(small_size, Image.Resampling.LANCZOS)
            small_mask = mask_img.resize(small_size, Image.Resampling.NEAREST)
            small_arr = np.array(small_img, dtype=np.float32) / 255.0
            small_m = np.array(small_mask, dtype=np.uint8) > 32
            inpainted_small = inpaint_biharmonic(small_arr, small_m, channel_axis=-1)
            inpainted_up = Image.fromarray(
                np.clip(inpainted_small * 255.0, 0, 255).astype(np.uint8),
                mode="RGB",
            ).resize(original.size, Image.Resampling.LANCZOS)
            up_arr = np.array(inpainted_up, dtype=np.float32) / 255.0
            merged = np.where(mask_arr[:, :, None], up_arr, orig_arr)
            result_img = Image.fromarray(
                np.clip(merged * 255.0, 0, 255).astype(np.uint8),
                mode="RGB",
            )
        else:
            inpainted = inpaint_biharmonic(orig_arr, mask_arr, channel_axis=-1)
            result_img = Image.fromarray(
                np.clip(inpainted * 255.0, 0, 255).astype(np.uint8),
                mode="RGB",
            )

    out_buffer = BytesIO()
    if export_format == "jpeg":
        result_img.save(out_buffer, format="JPEG", quality=96, subsampling=0, optimize=True)
        content_type = "image/jpeg"
    else:
        result_img.save(out_buffer, format="PNG", compress_level=3)
        content_type = "image/png"

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return ObjectRemovalResult(
        image_bytes=out_buffer.getvalue(),
        content_type=content_type,
        width=result_img.width,
        height=result_img.height,
        processing_ms=elapsed_ms,
    )
