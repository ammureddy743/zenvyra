import logging

from fastapi import APIRouter, Form, HTTPException, Response

from app.config import get_settings
from app.routers.deps import image_response_headers
from app.services.image_generator import generate_image_from_prompt
from app.services.video_generator import MotionType, generate_video_from_prompt

logger = logging.getLogger("zenvyra.api.media_gen")
settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix, tags=["Generative AI Media"])


@router.post("/generate-image")
async def generate_image(
    prompt: str = Form(...),
    style: str = Form("photorealistic"),
    width: int = Form(1024),
    height: int = Form(1024),
):
    clean = prompt.strip()
    if len(clean) < 2:
        raise HTTPException(status_code=400, detail="Please enter a prompt to generate an image.")
    if len(clean) > 1000:
        raise HTTPException(status_code=400, detail="Prompt must be under 1000 characters.")

    try:
        result = await generate_image_from_prompt(
            prompt=clean,
            style=style,
            width=width,
            height=height,
        )
    except Exception as exc:
        logger.exception("Image generation failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Image generation service is busy or unavailable. Please try again.",
        )

    return Response(
        content=result.image_bytes,
        media_type=result.content_type,
        headers=image_response_headers(result.width, result.height, result.processing_ms),
    )


@router.post("/generate-video")
async def generate_video(
    prompt: str = Form(...),
    style: str = Form("photorealistic"),
    motion: MotionType = Form("zoom-in"),
    duration_sec: int = Form(3),
    width: int = Form(768),
    height: int = Form(432),
):
    clean = prompt.strip()
    if len(clean) < 2:
        raise HTTPException(status_code=400, detail="Please enter a prompt to generate a video.")
    if len(clean) > 1000:
        raise HTTPException(status_code=400, detail="Prompt must be under 1000 characters.")

    try:
        result = await generate_video_from_prompt(
            prompt=clean,
            style=style,
            motion=motion,
            duration_sec=duration_sec,
            width=width,
            height=height,
        )
    except Exception as exc:
        logger.exception("Video generation failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Video generation service is busy or unavailable. Please try again.",
        )

    return Response(
        content=result.video_bytes,
        media_type=result.content_type,
        headers=image_response_headers(
            result.width,
            result.height,
            result.processing_ms,
            extra={"X-Duration-Sec": str(result.duration_sec)},
        ),
    )
