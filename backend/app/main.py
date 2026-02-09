from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from app.config import Paths

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tasuke API",
    description="API for Tasuke video generation",
    version="2.0.0",
)

# CORS設定: 環境変数から許可オリジンを取得
# ALLOWED_ORIGINS: カンマ区切りで複数指定可能 (例: "http://localhost:3000,https://example.com")
default_origins = ["http://localhost:3000", "http://localhost:5173"]
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = default_origins

logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "tasuke-api"}


@app.get("/")
async def root():
    return {"message": "Tasuke API", "version": "2.0.0", "docs": "/docs"}


outputs_dir = Paths.get_outputs_dir()
if os.path.exists(outputs_dir):
    app.mount(
        "/outputs", StaticFiles(directory=outputs_dir, html=False), name="outputs"
    )
    logger.info(f"Mounted outputs directory: {outputs_dir}")
else:
    logger.warning(f"Outputs directory not found: {outputs_dir}")

assets_dir = Paths.get_assets_dir()
assets_dir = os.path.abspath(assets_dir)

if os.path.exists(assets_dir):
    backgrounds_dir = os.path.join(assets_dir, "backgrounds")
    logger.info(f"Assets directory: {assets_dir}")
    logger.info(f"Backgrounds directory exists: {os.path.exists(backgrounds_dir)}")
    if os.path.exists(backgrounds_dir):
        bg_files = os.listdir(backgrounds_dir)
        logger.info(f"Background files count: {len(bg_files)}")
        if bg_files:
            logger.info(f"Sample background files: {bg_files[:5]}")

    app.mount("/assets", StaticFiles(directory=assets_dir, html=False), name="assets")
    logger.info(f"Mounted assets directory: {assets_dir} at /assets")
else:
    logger.warning(f"Assets directory not found: {assets_dir}")
# Import and include routers
from app.api import videos, scripts, voices, management, websocket
from app.api.upload import router as upload_router

app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])
app.include_router(voices.router, prefix="/api/voices", tags=["voices"])
app.include_router(management.router, prefix="/api/management", tags=["management"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])
app.include_router(upload_router, prefix="/api", tags=["upload"])
