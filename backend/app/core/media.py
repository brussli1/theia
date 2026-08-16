"""Media storage helpers shared by the image upload endpoint and import scripts."""

from pathlib import Path

from app.core.config import settings


def ensure_media_dir() -> Path:
    media_dir = Path(settings.media_dir)
    media_dir.mkdir(parents=True, exist_ok=True)
    return media_dir


def build_media_url(relpath: str | Path) -> str:
    """Absolute browser URL for a file under the media directory."""
    return f"{settings.media_url.rstrip('/')}/media/{Path(relpath).as_posix()}"
