"""Kabadiwala Connect — FastAPI application entry point."""
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import APP_NAME, UPLOAD_DIR
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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup():
        init_db()
        log.info("%s backend ready", APP_NAME)

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
        return {"ok": True, "app": APP_NAME}

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
