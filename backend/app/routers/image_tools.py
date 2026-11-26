import logging
from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import UnidentifiedImageError

from app.config import get_settings
from app.routers.deps import image_response_headers, read_and_validate_image
from app.services.bg_remover import process_background_removal
from app.services.object_remover import process_object_removal
from app.services.passport_maker import PassportPreset, process_passport_photo
from app.services.photo_restorer import process_photo_restoration
from app.services.upscaler import process_upscale

logger = logging.getLogger("zenvyra.api.image_tools")
settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix, tags=["Image Editing Tools"])


@router.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    model: Literal["u2netp", "isnet-general-use", "birefnet-general"] = Form("u2netp"),
    export_format: Literal["png", "jpeg"] = Form("png"),
    bg_color: str = Form("#ffffff"),
    feather: float = Form(0.0),
    smooth: float = Form(0.0),
    shift_edge: int = Form(0),
):
    raw_bytes = await read_and_validate_image(file)

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

    extra = {"X-Model-Used": result.model_used}
    if result.quality_warning:
        extra["X-Quality-Warning"] = result.quality_warning

    return Response(
        content=result.image_bytes,
        media_type=result.content_type,
        headers=image_response_headers(
            result.width, result.height, result.processing_ms, extra
        ),
    )


@router.post("/upscale")
async def upscale_image(
    file: UploadFile = File(...),
    scale: int = Form(2),
    sharpen: float = Form(1.2),
    denoise: float = Form(0.0),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await read_and_validate_image(file)
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
        headers=image_response_headers(result.width, result.height, result.processing_ms),
    )


@router.post("/remove-object")
async def remove_object(
    file: UploadFile = File(...),
    mask: UploadFile = File(...),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await read_and_validate_image(file)
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
        headers=image_response_headers(result.width, result.height, result.processing_ms),
    )


@router.post("/restore-photo")
async def restore_photo(
    file: UploadFile = File(...),
    enhance_details: bool = Form(True),
    colorize: bool = Form(False),
    denoise_strength: float = Form(1.0),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await read_and_validate_image(file)

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
        headers=image_response_headers(result.width, result.height, result.processing_ms),
    )


@router.post("/passport-photo")
async def passport_photo(
    file: UploadFile = File(...),
    preset: PassportPreset = Form("us-2x2"),
    bg_color: str = Form("#ffffff"),
    printable_sheet: bool = Form(False),
    export_format: Literal["png", "jpeg"] = Form("png"),
):
    raw_bytes = await read_and_validate_image(file)

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
        headers=image_response_headers(result.width, result.height, result.processing_ms),
    )
