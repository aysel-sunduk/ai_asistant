"""
AI Asistan — FastAPI Ana Uygulama
Tüm AI modülleri için giriş noktası.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.blog_api import router as blog_router
from app.api.game_api import router as game_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlarken ve kapanırken çalışır."""
    logger.info("AI Asistan ML Service başlatılıyor...")
    # ML modellerini ön yükle
    from app.models.profanity_filter import _load_ml_model
    from app.models.title_generator import _load_model as _load_title_model
    from app.models.game_analyzer import _load_models as _load_game_models
    _load_ml_model()
    _load_title_model()
    _load_game_models()
    logger.info("ML Service hazır.")
    yield
    logger.info("ML Service kapatılıyor...")


app = FastAPI(
    title="AI Asistan ML Service",
    description="Türkçe argo/küfür filtresi, başlık önerisi ve AI modülleri",
    version="1.1.0",
    lifespan=lifespan,
)

# CORS — Spring Boot backend'den gelen isteklere izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(blog_router, prefix="/api")
app.include_router(game_router, prefix="/api")


@app.get("/health")
async def health_check():
    """Sağlık kontrolü."""
    from app.models.profanity_filter import _ml_loaded, _ml_model
    from app.models.title_generator import is_model_loaded as title_loaded
    from app.models.game_analyzer import is_models_loaded as game_loaded
    return {
        "status": "ok",
        "service": "ai-asistan-ml",
        "version": "1.2.0",
        "models": {
            "profanity_filter": _ml_loaded and _ml_model is not None,
            "title_generator": title_loaded(),
            "game_analyzer": game_loaded(),
        },
    }
