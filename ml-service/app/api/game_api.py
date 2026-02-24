"""
Oyun AI Endpoint'leri — Oyuncu Segmentasyonu ve Performans Trendi
"""

import logging
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.game_analyzer import get_player_segment, get_performance_trend

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/game", tags=["Game AI"])


# ─── Request / Response şemaları ───

class ScoreEntry(BaseModel):
    """Tek bir oyun skoru."""
    score: int = Field(..., description="Oyun skoru")
    durationSec: Optional[int] = Field(None, description="Oyun süresi (saniye)")
    level: Optional[int] = Field(None, description="Seviye")
    playedAt: Optional[str] = Field(None, description="Oynanma zamanı ISO8601")


class PlayerSegmentRequest(BaseModel):
    """Oyuncu segmentasyonu isteği."""
    scores: List[ScoreEntry] = Field(..., min_length=1, description="Oyuncu skorları")


class PerformanceTrendRequest(BaseModel):
    """Performans trendi isteği."""
    scores: List[ScoreEntry] = Field(..., min_length=2, description="Oyuncu skorları (en az 2)")


# ─── Endpoint'ler ───

@router.post("/player-segment")
async def player_segment(request: PlayerSegmentRequest):
    """
    Oyuncunun segmentini belirler (K-Means).
    Başlangıç / Gelişen / Düzenli / Usta
    """
    scores_data = [s.model_dump() for s in request.scores]
    result = get_player_segment(scores_data)
    return {
        "success": True,
        "data": result,
    }


@router.post("/performance-trend")
async def performance_trend(request: PerformanceTrendRequest):
    """
    Oyuncunun performans trendini hesaplar (Linear Regression).
    Gelişim yüzdesi, trend yönü ve motivasyon mesajı döner.
    """
    scores_data = [s.model_dump() for s in request.scores]
    result = get_performance_trend(scores_data)
    return {
        "success": True,
        "data": result,
    }
