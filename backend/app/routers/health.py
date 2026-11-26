from fastapi import APIRouter

from app.config import get_settings
from app.services.bg_remover import SUPPORTED_MODELS

router = APIRouter(tags=["Health & Discovery"])
settings = get_settings()


@router.get("/")
async def root():
    return {
        "service": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
        "frontend_url": "http://localhost:3000",
    }


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "retention_hours": settings.file_retention_hours,
    }


@router.get(f"{settings.api_v1_prefix}/tools")
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
            {"id": "image-generator", "name": "AI Image & Video Generator", "status": "active"},
        ]
    }
