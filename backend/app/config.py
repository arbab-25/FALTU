"""Application configuration loaded from environment (.env at project root)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _load_dotenv() -> None:
    """Tiny .env loader so the prototype runs without extra dependencies."""
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Kabadiwala Connect")
ENV = os.getenv("ENV", "development")
SECRET_KEY = os.getenv("SECRET_KEY", "sih26229-demo-secret-change-me")

BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))

_database_url = os.getenv("DATABASE_URL", "sqlite:///./kabadiwala.db")
DATABASE_URL = _database_url
IS_POSTGRES = _database_url.startswith(("postgres://", "postgresql://"))
DATABASE_PATH = ROOT / _database_url.replace("sqlite:///", "").lstrip("/")

VISION_PROVIDER = os.getenv("VISION_PROVIDER", "demo")
VISION_API_KEY = os.getenv("VISION_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DEMO_CITY = "Ahmedabad"
DEMO_CITY_CENTER = (23.0225, 72.5714)  # lat, lng — Ahmedabad, Gujarat

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}

DEMO_NOTE = "Demo data for SIH26229 prototype — indicative figures only, not verified."
