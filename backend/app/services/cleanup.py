import asyncio
import logging
import time
from pathlib import Path

logger = logging.getLogger("zenvyra.cleanup")


def purge_expired_files(temp_dir: Path, retention_hours: int) -> int:
    """Delete temporary uploaded/processed files older than retention_hours."""
    if not temp_dir.exists():
        return 0

    cutoff = time.time() - (retention_hours * 3600)
    removed = 0
    for item in temp_dir.iterdir():
        try:
            if item.is_file() and item.stat().st_mtime < cutoff:
                item.unlink(missing_ok=True)
                removed += 1
        except OSError as exc:
            logger.warning("Failed to remove expired file %s: %s", item, exc)
    if removed:
        logger.info("Purged %d expired temp files older than %dh", removed, retention_hours)
    return removed


async def periodic_cleanup_loop(temp_dir: Path, retention_hours: int, interval_seconds: int = 3600) -> None:
    """Background loop that removes expired files every hour."""
    while True:
        try:
            purge_expired_files(temp_dir, retention_hours)
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.exception("Error during periodic cleanup: %s", exc)
        await asyncio.sleep(interval_seconds)
