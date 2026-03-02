"""
Shopping recommendation API endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import pandas as pd

from app.models.shopping_recommender import (
    evaluate_model,
    is_model_loaded,
    recommend_for_user,
    reload_model,
    train_and_save_artifacts,
)

router = APIRouter(prefix="/shopping", tags=["Shopping AI"])


class ShoppingInteraction(BaseModel):
    user_id: str
    list_id: str
    item_name: str
    is_checked: bool
    item_id: str | None = None
    product_key: str | None = None
    category: str | None = None
    quantity: int | None = None
    unit: str | None = None
    estimated_price_minor: int | None = None
    added_at: str | None = None
    checked_at: str | None = None
    list_created_at: str | None = None
    recurrence_type: str | None = None


class TrainRequest(BaseModel):
    interactions: list[ShoppingInteraction] = Field(..., min_length=1)


class RecommendQuery(BaseModel):
    top_k: int = Field(20, ge=1, le=100)
    w_assoc: float = Field(0.45, ge=0.0, le=1.0)
    w_repl: float = Field(0.35, ge=0.0, le=1.0)
    w_cf: float = Field(0.20, ge=0.0, le=1.0)


@router.post("/recommendations/train")
async def train_shopping_recommender(request: TrainRequest):
    try:
        df = pd.DataFrame([x.model_dump() for x in request.interactions])
        train_and_save_artifacts(df)
        return {"success": True, "message": "Shopping recommender trained and artifacts saved."}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/recommendations/reload")
async def reload_shopping_recommender():
    ok = reload_model()
    if not ok:
        raise HTTPException(status_code=404, detail="Shopping artifacts not found or failed to load.")
    return {"success": True, "message": "Shopping recommender artifacts loaded."}


@router.get("/recommendations/user/{user_id}")
async def get_shopping_recommendations(
    user_id: str,
    top_k: int = 20,
    w_assoc: float = 0.35,
    w_repl: float = 0.25,
    w_cf: float = 0.20,
    w_pop: float = 0.10,
    w_cat: float = 0.10,
):
    if abs((w_assoc + w_repl + w_cf + w_pop + w_cat) - 1.0) > 1e-3:
        raise HTTPException(status_code=400, detail="Weights must sum to 1.0")
    if not is_model_loaded() and not reload_model():
        raise HTTPException(status_code=503, detail="Shopping recommender model is not loaded.")
    try:
        data = recommend_for_user(
            user_id,
            top_k=top_k,
            w_assoc=w_assoc,
            w_repl=w_repl,
            w_cf=w_cf,
            w_pop=w_pop,
            w_cat=w_cat,
        )
        return {"success": True, "data": data}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/recommendations/metrics")
async def get_shopping_recommendation_metrics(
    top_k: int = 10,
    max_users: int = 200,
):
    if not is_model_loaded() and not reload_model():
        raise HTTPException(status_code=503, detail="Shopping recommender model is not loaded.")
    try:
        data = evaluate_model(top_k=top_k, max_users=max_users)
        return {"success": True, "data": data}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
