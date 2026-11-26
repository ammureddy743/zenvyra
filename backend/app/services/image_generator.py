import asyncio
from dataclasses import dataclass
from io import BytesIO
import random
import time
from urllib.parse import quote

import httpx
from PIL import Image, ImageOps

STYLE_PRESETS: dict[str, dict[str, str]] = {
    "photorealistic": {
        "prefix": "raw photograph, DSLR 35mm, ",
        "suffix": ", photorealistic, ultra detailed, natural lighting, sharp focus, 8k",
        "negative": "anime, cartoon, illustration, painting, 3d render, drawing, sketch",
    },
    "digital-art": {
        "prefix": "digital illustration, concept art, ",
        "suffix": ", vibrant colors, crisp painterly detail, artstation",
        "negative": "photograph, raw photo, blurry, low quality",
    },
    "anime": {
        "prefix": "anime key visual, cel shaded, studio anime artwork, ",
        "suffix": ", clean lineart, vibrant anime aesthetic, detailed anime background",
        "negative": "photorealistic, real life photograph, 3d render, blurry",
    },
    "3d-render": {
        "prefix": "3d octane render, blender cycles, ",
        "suffix": ", studio volumetric lighting, smooth PBR materials, 3d stylized",
        "negative": "2d, flat, sketch, anime, hand drawn, photograph",
    },
    "minimalist": {
        "prefix": "minimalist graphic art, ",
        "suffix": ", clean geometric composition, flat colors, modern minimal aesthetic, negative space",
        "negative": "cluttered, busy, photorealistic, noisy, complex texture",
    },
}


@dataclass
class GeneratedImageResult:
    image_bytes: bytes
    content_type: str
    width: int
    height: int
    processing_ms: int


def _fit_to_target(image_bytes: bytes, target_w: int, target_h: int) -> bytes:
    """Center-crop and resize generated image to exact requested dimensions."""
    with Image.open(BytesIO(image_bytes)) as img:
        rgb = img.convert("RGB")
        if rgb.size == (target_w, target_h):
            return image_bytes
        fitted = ImageOps.fit(rgb, (target_w, target_h), method=Image.Resampling.LANCZOS)
        out = BytesIO()
        fitted.save(out, format="JPEG", quality=94)
        return out.getvalue()


async def _try_pollinations(
    client: httpx.AsyncClient,
    full_prompt: str,
    seed: int,
    safe_w: int,
    safe_h: int,
) -> tuple[bytes, str] | None:
    """Try Pollinations image generation across safe fallback resolutions."""
    candidates: list[tuple[int, int]] = [(safe_w, safe_h)]
    for fallback in [(1024, 1024), (512, 512)]:
        if fallback not in candidates:
            candidates.append(fallback)

    for req_w, req_h in candidates:
        url = (
            f"https://image.pollinations.ai/prompt/{quote(full_prompt)}"
            f"?width={req_w}&height={req_h}"
        )
        if (req_w, req_h) == (safe_w, safe_h):
            url += f"&seed={seed}"
        try:
            resp = await client.get(url)
            if resp.status_code in (402, 429, 500, 502, 503, 504):
                await asyncio.sleep(0.4)
                continue
            resp.raise_for_status()
            img_bytes = resp.content
            ct = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            if (req_w, req_h) != (safe_w, safe_h):
                img_bytes = _fit_to_target(img_bytes, safe_w, safe_h)
                ct = "image/jpeg"
            return img_bytes, ct
        except Exception:
            await asyncio.sleep(0.3)
    return None


async def _try_aihorde(
    client: httpx.AsyncClient,
    full_prompt: str,
    negative_prompt: str,
    safe_w: int,
    safe_h: int,
) -> tuple[bytes, str]:
    """Fallback to AI Horde anonymous text-to-image queue."""
    # AI Horde anonymous tier requires <= 610x610 and <= 15 steps (no kudos upfront)
    horde_w, horde_h = 512, 512
    horde_prompt = (
        f"{full_prompt} ### {negative_prompt}" if negative_prompt else full_prompt
    )

    headers = {
        "apikey": "0000000000",
        "Client-Agent": "Zenvyra:1.0:dev",
    }
    submit = await client.post(
        "https://aihorde.net/api/v2/generate/async",
        json={
            "prompt": horde_prompt,
            "params": {"width": horde_w, "height": horde_h, "steps": 15, "n": 1},
            "nsfw": False,
        },
        headers=headers,
    )
    submit.raise_for_status()
    job_id = submit.json()["id"]

    for _ in range(40):
        await asyncio.sleep(2.0)
        status_resp = await client.get(
            f"https://aihorde.net/api/v2/generate/status/{job_id}",
            headers=headers,
        )
        status_resp.raise_for_status()
        data = status_resp.json()
        if data.get("done") and data.get("generations"):
            img_url = data["generations"][0]["img"]
            img_resp = await client.get(img_url)
            img_resp.raise_for_status()
            fitted = _fit_to_target(img_resp.content, safe_w, safe_h)
            return fitted, "image/jpeg"
        if data.get("faulted"):
            raise RuntimeError("AI Horde generation faulted.")

    raise TimeoutError("AI Horde generation timed out.")


async def generate_image_from_prompt(
    prompt: str,
    style: str = "photorealistic",
    width: int = 1024,
    height: int = 1024,
) -> GeneratedImageResult:
    """Generate an AI image from a text prompt with multi-provider fallback."""
    started = time.perf_counter()

    clean_prompt = prompt.strip()
    preset = STYLE_PRESETS.get(style, STYLE_PRESETS["photorealistic"])
    full_prompt = f"{preset['prefix']}{clean_prompt}{preset['suffix']}"
    negative_prompt = preset["negative"]
    seed = random.randint(1, 999999)

    safe_w = max(512, min(width, 1280))
    safe_h = max(512, min(height, 1280))

    async with httpx.AsyncClient(
        timeout=60.0,
        follow_redirects=True,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
    ) as client:
        result = await _try_pollinations(client, full_prompt, seed, safe_w, safe_h)
        if result is None:
            result = await _try_aihorde(
                client, full_prompt, negative_prompt, safe_w, safe_h
            )

    image_bytes, content_type = result
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return GeneratedImageResult(
        image_bytes=image_bytes,
        content_type=content_type,
        width=safe_w,
        height=safe_h,
        processing_ms=elapsed_ms,
    )
