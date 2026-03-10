"""
Diyet Öneri Sistemi — FastAPI Endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.diet_recommender import recommender

router = APIRouter()


class DietRecommendRequest(BaseModel):
    calorie_target: int = Field(..., gt=500, lt=6000, description="Günlük kalori hedefi (kcal)")
    diet_goal: str = Field(default="MAINTAIN", description="LOSE_WEIGHT / MAINTAIN / GAIN_WEIGHT")
    allergies: Optional[List[str]] = Field(default=[], description="Alerji listesi")
    preference: Optional[str] = Field(default="NORMAL", description="NORMAL / VEGETARIAN / VEGAN / LOW_CARB / HIGH_PROTEIN")
    excluded_foods: Optional[List[str]] = Field(default=[], description="İstenmeyen yiyecekler")


class MealSwapRequest(BaseModel):
    slot: str = Field(..., description="Değiştirilecek öğün: BREAKFAST / SNACK_AM / LUNCH / SNACK_PM / DINNER")
    calorie_target: int = Field(..., gt=500, lt=6000)
    diet_goal: str = Field(default="MAINTAIN")
    excluded_recipe_ids: Optional[List[int]] = Field(default=[], description="Hariç tutulacak tarif ID'leri")
    preference: Optional[str] = Field(default="NORMAL")


@router.post("/diet/recommend")
async def recommend_diet_plan(request: DietRecommendRequest):
    """Kişiselleştirilmiş günlük öğün planı oluştur."""
    if not recommender.initialized:
        raise HTTPException(status_code=503, detail="Diyet öneri modeli henüz yüklenmedi.")

    try:
        result = recommender.recommend_daily_plan(
            calorie_target=request.calorie_target,
            diet_goal=request.diet_goal,
            allergies=request.allergies,
            preference=request.preference,
            excluded_foods=request.excluded_foods,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Öneri oluşturma hatası: {str(e)}")


@router.post("/diet/meal-swap")
async def swap_meal(request: MealSwapRequest):
    """Belirli bir öğün için alternatif yemek öner."""
    if not recommender.initialized:
        raise HTTPException(status_code=503, detail="Diyet öneri modeli henüz yüklenmedi.")

    try:
        result = recommender.swap_meal(
            slot=request.slot,
            calorie_target=request.calorie_target,
            diet_goal=request.diet_goal,
            excluded_recipe_ids=request.excluded_recipe_ids,
            preference=request.preference,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yemek değiştirme hatası: {str(e)}")
