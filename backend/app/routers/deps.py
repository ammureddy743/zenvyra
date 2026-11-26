from fastapi import HTTPException, UploadFile

from app.config import get_settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


async def read_and_validate_image(file: UploadFile) -> bytes:
    """Read and validate uploaded image bytes against MIME type and size limits."""
    settings = get_settings()
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


def image_response_headers(
    width: int,
    height: int,
    processing_ms: int,
    extra: dict[str, str] | None = None,
) -> dict[str, str]:
    """Build standard Zenvyra image response headers."""
    headers = {
        "X-Original-Width": str(width),
        "X-Original-Height": str(height),
        "X-Processing-Ms": str(processing_ms),
        "Cache-Control": "no-store",
    }
    if extra:
        headers.update(extra)
    return headers
