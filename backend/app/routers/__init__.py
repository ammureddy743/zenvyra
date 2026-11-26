from app.routers.health import router as health_router
from app.routers.image_tools import router as image_tools_router
from app.routers.media_gen import router as media_gen_router

__all__ = ["health_router", "image_tools_router", "media_gen_router"]
