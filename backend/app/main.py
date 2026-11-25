import asyncio
from contextlib import asynccontextmanager
import logging
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from PIL import UnidentifiedImageError

from app.config import get_settings
from app.services.bg_remover import (
    SUPPORTED_MODELS,
    process_background_removal,
)
from app.services.cleanup import periodic_cleanup_loop, purge_expired_files
from app.services.image_generator import generate_image_from_prompt
from app.services.object_remover import process_object_removal
from app.services.passport_maker import PassportPreset, process_passport_photo
from app.services.photo_restorer import process_photo_restoration
from app.services.upscaler import process_upscale

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zenvyra.api")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    purge_expired_files(settings.temp_dir, settings.file_retention_hours)
    cleanup_task = asyncio.create_task(
        periodic_cleanup_loop(settings.temp_dir, settings.file_retention_hours)
    )
    yield
    cleanup_task.cancel()


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Original-Width",
        "X-Original-Height",
        "X-Quality-Warning",
        "X-Model-Used",
        "X-Processing-Ms",
    ],
)


async def _read_and_validate_image(file: UploadFile) -> bytes:
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file format. Please upload a JPG, PNG, or WebP image.",
        )

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(raw_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.max_upload_mb} MB upload limit.",
        )
    return raw_bytes


@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
        "frontend_url": "http://localhost:3000",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "retention_hours": settings.file_retention_hours,
    }


@app.get(f"{settings.api_v1_prefix}/tools")
async def list_tools():
    return {
        "tools": [
            {
                "id": "background-remover",
                "name": "Background Remover",
                "status": "active",
                "models": SUPPORTED_MODELS,
            },
            {"id": "upscaler", "name": "Image Upscaler", "status": "active"},
            {"id": "object-remover", "name": "Object Remover", "status": "active"},
            {"id": "photo-restorer", "name": "Old Photo Restorer", "status": "active"},
            {"id": "passport-maker", "name": "Passport Photo Maker", "status": "active"},
            {"id": "image-generator", "name": "AI Image Generator", "status": "active"},
        ]
    }


@app.post(f"{settings.api_v1_prefix}/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    model: Literal["u2netp", "isnet-general-use", "birefnet-general"] = Form("u2netp"),
    export_format: Literal["png", "jpeg"] = Form("png"),
    bg_color: str = Form("#ffffff"),
    feather: float = Form(0.0),
    smooth: float = Form(0.0),
    shift_edge: int = Form(0),
):
    raw_bytes = await _read_and_validate_image(file)

    try:
        result = await run_in_threadpool(
            process_background_removal,
            raw_bytes=raw_bytes,
            model_name=model,
            export_format=export_format,
            bg_color=bg_color,
            feather=max(0.0, min(feather, 20.0)),
            smooth=max(0.0, min(smooth, 10.0)),
            shift_edge=max(-10, min(shift_edge, 10)),
        )
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Could not read image. Please upload a valid JPG, PNG, or WebP file.",
        )
    except Exception as exc:
        logger.exception("Background removal failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="AI processing failed. Please try again or switch models.",
        )

    headers = {
        "X-Original-Width": str(result.width),
        "X-Original-Height": str(result.height),
        "X-Model-Used": result.model_used,
        "X-Processing-Ms": str(result.processing_ms),
        "Cache-Control": "no-store",
    }
    if result.quality_warning:
        headers["X-Quality-Warning"] = result.quality_warning

    return Response(
        content=result.image_bytes,
        media_type=result.content_type,
        headers=headers,
    )


@app.post(f"{settings.api_v1_prefix}/upscale")
async def upscale_image(
    file: UploadFile = File(...),
    scale: int = Form(2),
    sharpen: float = Form(1.2),
    denoise: float = Form(0.0),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await _read_and_validate_image(file)
    safe_scale: Literal[2, 4] = 4 if scale == 4 else 2

    try:
        result = await run_in_threadpool(
            process_upscale,
            raw_bytes=raw_bytes,
            scale=safe_scale,
            sharpen=max(0.0, min(sharpen, 3.0)),
            denoise=max(0.0, min(denoise, 3.0)),
            export_format=export_format,
        )
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file.")
    except Exception as exc:
        logger.exception("Upscale failed: %s", exc)
        raise HTTPException(status_code=500, detail="Upscaling failed.")

    return Response(
        content=result.image_bytes,
        media_type=result.content_type,
        headers={
            "X-Original-Width": str(result.width),
            "X-Original-Height": str(result.height),
            "X-Processing-Ms": str(result.processing_ms),
            "Cache-Control": "no-store",
        },
    )


@app.post(f"{settings.api_v1_prefix}/remove-object")
async def remove_object(
    file: UploadFile = File(...),
    mask: UploadFile = File(...),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await _read_and_validate_image(file)
    mask_bytes = await mask.read()
    if not mask_bytes:
        raise HTTPException(status_code=400, detail="Mask image is required.")

    try:
        result = await run_in_threadpool(
            process_object_removal,
            raw_bytes=raw_bytes,
            mask_bytes=mask_bytes,
            export_format=export_format,
        )
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image or mask file.")
    except Exception as exc:
        logger.exception("Object removal failed: %s", exc)
        raise HTTPException(status_code=500, detail="Object removal failed.")

    return Response(
        content=result.image_bytes,
        media_type=result.content_type,
        headers={
            "X-Original-Width": str(result.width),
            "X-Original-Height": str(result.height),
            "X-Processing-Ms": str(result.processing_ms),
            "Cache-Control": "no-store",
        },
    )


@app.post(f"{settings.api_v1_prefix}/restore-photo")
async def restore_photo(
    file: UploadFile = File(...),
    enhance_details: bool = Form(True),
    colorize: bool = Form(False),
    denoise_strength: float = Form(1.0),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await _read_and_validate_image(file)

    try:
        result = await run_in_threadpool(
            process_photo_restoration,
            raw_bytes=raw_bytes,
            enhance_details=enhance_details,
            colorize=colorize,
            denoise_strength=max(0.0, min(denoise_strength, 2.0)),
            export_format=export_format,
        )
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file.")
    except Exception as exc:
        logger.exception("Photo restoration failed: %s", exc)
        raise HTTPException(status_code=500, detail="Photo restoration failed.")

    return Response(
        content=result.image_bytes,
        media_type=result.content_type,
        headers={
            "X-Original-Width": str(result.width),
            "X-Original-Height": str(result.height),
            "X-Processing-Ms": str(result.processing_ms),
            "Cache-Control": "no-store",
        },
    )


@app.post(f"{settings.api_v1_prefix}/passport-photo")
async def passport_photo(
    file: UploadFile = File(...),
    preset: PassportPreset = Form("us-2x2"),
    bg_color: str = Form("#ffffff"),
    printable_sheet: bool = Form(False),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await _read_and_validate_image(file)

    try:
        result = await run_in_threadpool(
            process_passport_photo,
            raw_bytes=raw_bytes,
            preset=preset,
            bg_color=bg_color,
            printable_sheet=printable_sheet,
            export_format=export_format,
        )
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file.")
    except Exception as exc:
        logger.exception("Passport photo failed: %s", exc)
        raise HTTPException(status_code=500, detail="Passport photo creation failed.")

    return Response(
        content=result.image_bytes,
        media_type=result.content_type,
        headers={
            "X-Original-Width": str(result.width),
            "X-Original-Height": str(result.height),
            "X-Processing-Ms": str(result.processing_ms),
            "Cache-Control": "no-store",
        },
    )


@app.post(f"{settings.api_v1_prefix}/generate-image")
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
        headers={
            "X-Original-Width": str(result.width),
            "X-Original-Height": str(result.height),
            "X-Processing-Ms": str(result.processing_ms),
            "Cache-Control": "no-store",
        },
    )
