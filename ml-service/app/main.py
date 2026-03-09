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
from app.api.shopping_api import router as shopping_router
from app.api.finance_api import router as finance_router
from app.api.food_api import router as food_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlarken ve kapanırken çalışır."""
    logger.info("AI Asistan ML Service başlatılıyor...")
    
    # ML modellerini ön yükle - Her biri bağımsız yüklensin ki biri hata verirse servis çökmesin
    # try:
    #     from app.models.profanity_filter import _load_ml_model
    #     _load_ml_model()
    # except Exception as e:
    #     logger.error(f"Argo filtresi yuklenemedi: {e}")

    # try:
    #     from app.models.title_generator import _load_model as _load_title_model
    #     _load_title_model()
    # except Exception as e:
    #     logger.error(f"Baslik onerici yuklenemedi: {e}")

    # try:
    #     from app.models.game_analyzer import _load_models as _load_game_models
    #     _load_game_models()
    # except Exception as e:
    #     logger.error(f"Oyun analizoru yuklenemedi: {e}")

    # try:
    #     from app.models.motivation_predictor import _load_models as _load_motivation_model
    #     _load_motivation_model()
    # except Exception as e:
    #     logger.error(f"Motivasyon tahminci yuklenemedi: {e}")

    # try:
    #     from app.models.shopping_recommender import _load_artifacts as _load_shopping_artifacts
    #     _load_shopping_artifacts()
    # except Exception as e:
    #     logger.error(f"Alisveris onerici yuklenemedi: {e}")

    # try:
    #     from app.models.investment_recommender import _load_models as _load_investment_models
    #     _load_investment_models()
    # except Exception as e:
    #     logger.error(f"Yatirim onerici yuklenemedi: {e}")

    try:
        from app.models.food_analyzer import _load_model as _load_food_model
        _load_food_model()
    except Exception as e:
        logger.error(f"Yemek analiz modeli yuklenemedi: {e}")

    logger.info("ML Service yukleme süreci tamamlandı.")
    yield
    logger.info("ML Service kapatılıyor...")


app = FastAPI(
    title="AI Asistan ML Service",
    description="Türkçe argo/küfür filtresi, başlık önerisi ve AI modülleri",
    version="1.3.0",
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
app.include_router(shopping_router, prefix="/api")
app.include_router(finance_router, prefix="/api")
app.include_router(food_router, prefix="/api")



@app.get("/health")
async def health_check():
    """Sağlık kontrolü."""
    from app.models.profanity_filter import _ml_loaded, _ml_model
    from app.models.title_generator import is_model_loaded as title_loaded
    from app.models.game_analyzer import is_models_loaded as game_loaded
    from app.models.motivation_predictor import is_model_loaded as motivation_loaded
    from app.models.shopping_recommender import is_model_loaded as shopping_loaded
    from app.models.investment_recommender import is_model_loaded as investment_loaded
    from app.models.food_analyzer import analyzer
    return {
        "status": "ok",
        "service": "ai-asistan-ml",
        "version": "1.4.0",
        "models": {
            "profanity_filter": _ml_loaded and _ml_model is not None,
            "title_generator": title_loaded(),
            "game_analyzer": game_loaded(),
            "motivation_predictor": motivation_loaded(),
            "shopping_recommender": shopping_loaded(),
            "investment_recommender": investment_loaded(),
            "food_analyzer": analyzer.initialized,
        },
    }

