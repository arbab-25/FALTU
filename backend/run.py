"""Backend launcher.

Usage:
    python backend/run.py            # start API (auto-seeds demo data on first run)
    python backend/run.py --seed     # ensure demo data exists, then exit
    python backend/run.py --seed --fresh   # rebuild the demo database from scratch
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import BACKEND_HOST, BACKEND_PORT  # noqa: E402
from app.database import init_db  # noqa: E402


def main() -> None:
    args = set(sys.argv[1:])
    if "--seed" in args or "--seed-fresh" in args or "--fresh" in args:
        from app.seed import seed

        seed(fresh="--fresh" in args or "--seed-fresh" in args)
        if "--seed" in args and "--run" not in args:
            return

    from app.main import app
    import uvicorn

    init_db()
    print("")
    print(f"  Kabadiwala Connect API  ->  http://{BACKEND_HOST}:{BACKEND_PORT}")
    print(f"  API docs            ->  http://{BACKEND_HOST}:{BACKEND_PORT}/api/docs")
    print("")
    uvicorn.run(app, host=BACKEND_HOST, port=BACKEND_PORT, log_level="warning")


if __name__ == "__main__":
    main()
