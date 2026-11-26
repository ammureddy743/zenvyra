import asyncio
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health_router, image_tools_router, media_gen_router
from app.services.cleanup import periodic_cleanup_loop, purge_expired_files

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zenvyra.api")


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
        "X-Duration-Sec",
    ],
)

app.include_router(health_router)
app.include_router(image_tools_router)
app.include_router(media_gen_router)
