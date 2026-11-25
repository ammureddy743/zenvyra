from dataclasses import dataclass
import random
import time
from urllib.parse import quote

import httpx

STYLE_MODIFIERS: dict[str, str] = {
    "photorealistic": "photorealistic, ultra detailed, natural lighting, 8k",
    "digital-art": "digital art illustration, vibrant colors, crisp detail",
    "anime": "anime style artwork, clean lineart, studio quality",
    "3d-render": "3d octane render, studio lighting, smooth materials",
    "minimalist": "minimalist modern aesthetic, clean composition",
}


@dataclass
class GeneratedImageResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    processing_ms: int


async def generate_image_from_prompt(
    prompt: str,
    style: str = "photorealistic",
    width: int = 1024,
    height: int = 1024,
) -> GeneratedImageResult:
    """Generate an AI image from a text prompt."""
    started = time.perf_counter()

    clean_prompt = prompt.strip()
    modifier = STYLE_MODIFIERS.get(style, "")
    full_prompt = f"{clean_prompt}, {modifier}" if modifier else clean_prompt
    seed = random.randint(1, 999999)

    safe_w = max(512, min(width, 1280))
    safe_h = max(512, min(height, 1280))

    url = (
        f"https://image.pollinations.ai/prompt/{quote(full_prompt)}"
        f"?width={safe_w}&height={safe_h}&seed={seed}&nologo=true"
    )

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        image_bytes = resp.content
        content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return GeneratedImageResult(
        image_bytes=image_bytes,
        content_type=content_type,
        width=safe_w,
        height=safe_h,
        processing_ms=elapsed_ms,
    )
