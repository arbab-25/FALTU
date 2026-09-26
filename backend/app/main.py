"""Kabadiwala Connect — FastAPI application entry point."""
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import APP_NAME, IS_POSTGRES, UPLOAD_DIR, database_label
import os
from .database import init_db
from .api import admin, auth, collectors, impact, notifications, pickups, waste

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("kabadiwala")


class StartupGuard:
    pass


def create_app() -> FastAPI:
    app = FastAPI(
        title="Kabadiwala Connect API",
        version="1.0.0 (SIH26229 prototype)",
        description="REST API for the Kabadiwala Connect recycling ecosystem prototype.",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )

    cors_origins = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
    ] or ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup():
        init_db()
        # Auto-provision demo data on cloud databases (Neon/Render).
        if IS_POSTGRES:
            import threading

            def _seed_bg():
                try:
                    from .seed import seed

                    seed(fresh=False)
                    log.info("Cloud database seeded with demo data")
                except Exception:
                    log.exception("Auto-seed failed (non-fatal)")

            threading.Thread(target=_seed_bg, daemon=True).start()
        log.info("%s backend ready | database: %s", APP_NAME, database_label())

    app.include_router(auth.router, prefix="/api")
    app.include_router(waste.router, prefix="/api")
    app.include_router(pickups.router, prefix="/api")
    app.include_router(collectors.router, prefix="/api")
    app.include_router(impact.router, prefix="/api")
    app.include_router(notifications.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")

    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

    @app.get("/api/health")
    def health():
        """Diagnostic health: reports which backend code and DB are live."""
        db_ok, db_err, counts = True, None, {}
        try:
            from .database import db
            with db() as conn:
                for tbl in ("users", "pickup_requests", "transactions"):
                    n = conn.execute(f"SELECT COUNT(*) AS n FROM {tbl}").fetchone()  # nosec B608 - fixed table tuple
                    counts[tbl] = int(n["n"] if not isinstance(n, dict) else (n.get("n") or 0))
        except Exception as e:  # pragma: no cover - diagnostics only
            db_ok, db_err = False, str(e)[:200]
        return {
            "ok": True,
            "app": APP_NAME,
            "code_version": "1.0.0-sih26229",
            "database": database_label(),
            "database_ok": db_ok,
            "database_error": db_err,
            "counts": counts,
            "time": datetime.now(timezone.utc).isoformat(),
        }

    @app.exception_handler(HTTPException)
    async def http_exc(request: Request, exc: HTTPException):
        return JSONResponse(status_code=exc.status_code,
                            content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception):
        log.exception("Unhandled error")
        return JSONResponse(status_code=500,
                            content={"detail": "Internal error — demo continues"})

    return app


app = create_app()
