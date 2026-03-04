"""
Finance recommendation API endpoints.
Yatırım öneri sistemi — ml-service FastAPI endpoint'leri.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

import pandas as pd

from app.models.investment_recommender import (
    is_model_loaded,
    reload_model,
    recommend_for_user,
    get_risk_profile,
    train_and_save_all,
    train_risk_model,
    train_cf_model,
    save_asset_features,
)

router = APIRouter(prefix="/finance", tags=["Finance AI"])


# ─── Request/Response Modelleri ──────────────────────────────────

class UserFeatures(BaseModel):
    user_id: str
    avg_monthly_expense: float = 0
    expense_volatility: float = 0
    savings_ratio: float = 0
    category_diversity: int = 0
    investment_count: int = 0
    total_investment_value: float = 0
    favorite_count: int = 0


class HoldingInfo(BaseModel):
    symbol: str
    quantity: float = 0
    value: float = 0
    asset_type: str = "CURRENCY"
    risk_level: str = "MEDIUM"


class RecommendRequest(BaseModel):
    user_id: str
    user_data: Dict[str, Any] = Field(default_factory=dict)
    holdings: List[HoldingInfo] = Field(default_factory=list)
    favorites: List[str] = Field(default_factory=list)
    top_k: int = Field(10, ge=1, le=50)
    w_cf: float = Field(0.35, ge=0.0, le=1.0)
    w_content: float = Field(0.25, ge=0.0, le=1.0)
    w_pop: float = Field(0.15, ge=0.0, le=1.0)
    w_trend: float = Field(0.25, ge=0.0, le=1.0)


class InteractionRecord(BaseModel):
    user_id: str
    symbol: str
    score: float = Field(..., ge=0, le=5)


class TrainRequest(BaseModel):
    user_features: List[UserFeatures] = Field(..., min_length=1)
    interactions: List[InteractionRecord] = Field(..., min_length=1)


class AssetFeatureRecord(BaseModel):
    symbol: str
    volatility_30d: float = 0
    trend_score: float = 0
    daily_change_pct: float = 0
    asset_type: str = "CURRENCY"
    risk_level: str = "MEDIUM"


class AssetFeaturesRequest(BaseModel):
    assets: List[AssetFeatureRecord] = Field(..., min_length=1)


# ─── Endpoint'ler ────────────────────────────────────────────────

@router.post("/recommendations/user")
async def get_investment_recommendations(request: RecommendRequest):
    """Kişiselleştirilmiş yatırım önerileri al."""
    # Weight toplamı kontrolü
    total_w = request.w_cf + request.w_content + request.w_pop + request.w_trend
    if abs(total_w - 1.0) > 0.05:
        raise HTTPException(
            status_code=400,
            detail=f"Ağırlıklar toplamı 1.0 olmalı, mevcut: {total_w:.2f}",
        )

    # Holdings dict'e çevir
    holdings_dict = {
        h.symbol: {
            "quantity": h.quantity,
            "value": h.value,
            "asset_type": h.asset_type,
            "risk_level": h.risk_level,
        }
        for h in request.holdings
    }

    try:
        result = recommend_for_user(
            user_id=request.user_id,
            user_data=request.user_data,
            user_holdings=holdings_dict,
            user_favorites=request.favorites,
            top_k=request.top_k,
            w_cf=request.w_cf,
            w_content=request.w_content,
            w_pop=request.w_pop,
            w_trend=request.w_trend,
        )
        return {"success": True, "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/recommendations/risk-profile")
async def get_user_risk_profile(user_data: Dict[str, Any]):
    """Kullanıcının risk profilini al."""
    try:
        profile = get_risk_profile(user_data)
        return {"success": True, "data": profile}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/recommendations/train")
async def train_investment_recommender(request: TrainRequest):
    """Tüm modelleri eğit (risk profili + collaborative filtering)."""
    try:
        user_df = pd.DataFrame([u.model_dump() for u in request.user_features])
        interactions_df = pd.DataFrame([i.model_dump() for i in request.interactions])

        results = train_and_save_all(user_df, interactions_df)
        return {"success": True, "data": results}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/recommendations/train/risk")
async def train_risk_only(user_features: List[UserFeatures]):
    """Sadece risk profili modelini eğit."""
    try:
        df = pd.DataFrame([u.model_dump() for u in user_features])
        result = train_risk_model(df)
        return {"success": True, "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/recommendations/train/cf")
async def train_cf_only(interactions: List[InteractionRecord]):
    """Sadece collaborative filtering modelini eğit."""
    try:
        df = pd.DataFrame([i.model_dump() for i in interactions])
        result = train_cf_model(df)
        return {"success": True, "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/recommendations/assets/update")
async def update_asset_features(request: AssetFeaturesRequest):
    """Asset feature'larını güncelle (dış veri kaynaklarından)."""
    try:
        df = pd.DataFrame([a.model_dump() for a in request.assets])
        df = df.set_index("symbol")
        result = save_asset_features(df)
        return {"success": True, "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/recommendations/reload")
async def reload_investment_recommender():
    """Kaydedilmiş modelleri yeniden yükle."""
    ok = reload_model()
    if not ok:
        raise HTTPException(
            status_code=404,
            detail="Investment recommender model dosyaları bulunamadı veya yüklenemedi.",
        )
    return {"success": True, "message": "Investment recommender modelleri yüklendi."}


@router.get("/recommendations/status")
async def get_model_status():
    """Model durumunu kontrol et."""
    return {
        "success": True,
        "data": {
            "loaded": is_model_loaded(),
            "model_name": "investment_recommender",
            "version": "1.0.0",
            "layers": ["risk_profile", "collaborative_filtering", "content_based"],
        },
    }
