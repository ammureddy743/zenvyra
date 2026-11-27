import asyncio
from contextlib import asynccontextmanager
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health_router, image_tools_router, media_gen_router
from app.services.admin_metrics import record_tool_error, record_tool_run
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

_PATH_TO_TOOL = {
    "/api/v1/remove-background": "background-remover",
    "/api/v1/upscale": "upscaler",
    "/api/v1/remove-object": "object-remover",
    "/api/v1/restore-photo": "photo-restorer",
    "/api/v1/passport-photo": "passport-maker",
    "/api/v1/generate-image": "image-generator",
}


@app.middleware("http")
async def track_tool_metrics(request: Request, call_next):
    tool_id = _PATH_TO_TOOL.get(request.url.path)
    if not tool_id or request.method != "POST":
        return await call_next(request)

    started = time.perf_counter()
    try:
        response = await call_next(request)
        ms = int((time.perf_counter() - started) * 1000)
        if response.status_code >= 500:
            record_tool_error(tool_id, f"HTTP {response.status_code}")
        elif response.status_code < 400:
            record_tool_run(tool_id, ms)
        return response
    except Exception as exc:
        record_tool_error(tool_id, str(exc))
        raise
