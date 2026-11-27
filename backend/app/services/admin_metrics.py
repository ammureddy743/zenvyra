from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging

from app.config import get_settings

logger = logging.getLogger("zenvyra.admin")

ALL_TOOL_IDS = [
    "background-remover",
    "upscaler",
    "object-remover",
    "photo-restorer",
    "passport-maker",
    "image-generator",
]


@dataclass
class ToolRuntimeStats:
    total_runs: int = 0
    successful_runs: int = 0
    error_count: int = 0
    total_ms: int = 0


@dataclass
class MetricsStore:
    tools: dict[str, ToolRuntimeStats] = field(
        default_factory=lambda: defaultdict(ToolRuntimeStats)
    )
    recent_errors: list[dict[str, str]] = field(default_factory=list)


_RUNTIME_METRICS = MetricsStore()


def record_tool_run(tool_id: str, processing_ms: int) -> None:
    stats = _RUNTIME_METRICS.tools[tool_id]
    stats.total_runs += 1
    stats.successful_runs += 1
    stats.total_ms += max(0, processing_ms)


def record_tool_error(tool_id: str, error_message: str) -> None:
    stats = _RUNTIME_METRICS.tools[tool_id]
    stats.total_runs += 1
    stats.error_count += 1
    _RUNTIME_METRICS.recent_errors.insert(
        0,
        {
            "tool_id": tool_id,
            "error_message": error_message[:300],
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    if len(_RUNTIME_METRICS.recent_errors) > 20:
        _RUNTIME_METRICS.recent_errors.pop()


def get_admin_metrics() -> dict:
    settings = get_settings()
    total_users: int | None = None
    source = "runtime"
    tool_rows: dict[str, dict] = {
        tid: {
            "tool_id": tid,
            "total_runs": _RUNTIME_METRICS.tools[tid].total_runs,
            "successful_runs": _RUNTIME_METRICS.tools[tid].successful_runs,
            "error_count": _RUNTIME_METRICS.tools[tid].error_count,
            "avg_processing_ms": (
                round(
                    _RUNTIME_METRICS.tools[tid].total_ms
                    / _RUNTIME_METRICS.tools[tid].successful_runs
                )
                if _RUNTIME_METRICS.tools[tid].successful_runs > 0
                else 0
            ),
        }
        for tid in ALL_TOOL_IDS
    }
    recent_errors = list(_RUNTIME_METRICS.recent_errors)

    if settings.supabase_url and settings.supabase_service_role_key:
        try:
            from postgrest.types import CountMethod
            from supabase import create_client

            sb = create_client(settings.supabase_url, settings.supabase_service_role_key)
            users_res = sb.table("profiles").select("id", count=CountMethod.exact).execute()
            total_users = users_res.count if users_res.count is not None else len(users_res.data or [])

            jobs_res = sb.table("admin_tool_metrics").select("*").execute()
            for row in jobs_res.data or []:
                if not isinstance(row, dict):
                    continue
                tid = row.get("tool_id")
                if isinstance(tid, str) and tid in tool_rows:
                    tool_rows[tid] = {
                        "tool_id": tid,
                        "total_runs": int(row.get("total_runs") or 0) if isinstance(row.get("total_runs"), (int, float, str)) else 0,
                        "successful_runs": int(row.get("successful_runs") or 0) if isinstance(row.get("successful_runs"), (int, float, str)) else 0,
                        "error_count": int(row.get("error_count") or 0) if isinstance(row.get("error_count"), (int, float, str)) else 0,
                        "avg_processing_ms": int(row.get("avg_processing_ms") or 0) if isinstance(row.get("avg_processing_ms"), (int, float, str)) else 0,
                    }
            err_res = (
                sb.table("edit_jobs")
                .select("tool_id, error_message, created_at")
                .eq("status", "failed")
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )
            if err_res.data:
                recent_errors = err_res.data
            source = "supabase+runtime"
        except Exception as exc:
            logger.warning("Supabase admin query fallback to runtime: %s", exc)

    total_runs = sum(r["total_runs"] for r in tool_rows.values())
    total_errors = sum(r["error_count"] for r in tool_rows.values())

    return {
        "source": source,
        "total_users": total_users,
        "total_runs": total_runs,
        "total_errors": total_errors,
        "tools": list(tool_rows.values()),
        "recent_errors": recent_errors,
    }
