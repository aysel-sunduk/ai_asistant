"""
Oyun AI Endpoint'leri — Oyuncu Segmentasyonu, Performans Trendi ve Motivasyon Mesajı
"""

import logging
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.game_analyzer import get_player_segment, get_performance_trend
from app.models.motivation_predictor import get_motivation_message

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


class MotivationRequest(BaseModel):
    """Motivasyon mesajı isteği."""
    age: int = Field(25, description="Oyuncu yaşı")
    playTimeHours: float = Field(5.0, description="Toplam oynama süresi (saat)")
    inGamePurchases: int = Field(0, description="Oyun içi satın alma (0 veya 1)")
    sessionsPerWeek: int = Field(3, description="Haftalık oturum sayısı")
    avgSessionDurationMinutes: int = Field(60, description="Ortalama oturum süresi (dakika)")
    playerLevel: int = Field(20, description="Oyuncu seviyesi")
    achievementsUnlocked: int = Field(10, description="Açılan başarı sayısı")
    gender: Optional[str] = Field("Male", description="Cinsiyet (Male/Female)")
    location: Optional[str] = Field("USA", description="Konum (USA/Europe/Asia/Other)")
    gameGenre: Optional[str] = Field("Action", description="Oyun türü (Action/RPG/Strategy/Sports/Simulation)")
    gameDifficulty: Optional[str] = Field("Medium", description="Zorluk (Easy/Medium/Hard)")


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


@router.post("/motivation")
async def motivation_message(request: MotivationRequest):
    """
    Oyuncu davranışına göre motivasyon mesajı döner (RandomForest).
    6 farklı duruma göre bağlama duyarlı mesaj seçer.
    """
    result = get_motivation_message(
        age=request.age,
        play_time_hours=request.playTimeHours,
        in_game_purchases=request.inGamePurchases,
        sessions_per_week=request.sessionsPerWeek,
        avg_session_duration=request.avgSessionDurationMinutes,
        player_level=request.playerLevel,
        achievements_unlocked=request.achievementsUnlocked,
        gender=request.gender or "Male",
        location=request.location or "USA",
        game_genre=request.gameGenre or "Action",
        game_difficulty=request.gameDifficulty or "Medium",
    )
    return {
        "success": True,
        "data": result,
    }
