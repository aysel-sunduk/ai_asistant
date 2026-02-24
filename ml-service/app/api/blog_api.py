"""
AI Asistan — Blog Filtreleme API Endpointleri
Blog yazıları ve yorumlar için argo/küfür filtresi ve başlık önerisi.
"""

from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.models.profanity_filter import filter_text, blacklist_filter
from app.models.title_generator import generate_titles

router = APIRouter(tags=["Blog Filtresi"])


# ── Request / Response modelleri ────────────────────────

class FilterRequest(BaseModel):
    """Filtreleme isteği."""
    text: str = Field(..., min_length=1, max_length=50000, description="Filtrelenecek metin")
    threshold: float = Field(0.5, ge=0.0, le=1.0, description="Argo eşik skoru (0-1)")


class FilterResponse(BaseModel):
    """Filtreleme sonucu."""
    original_text: str
    cleaned_text: str
    profanity_score: float | None = None
    flagged_words: list[str] = []
    blacklist_hit_count: int = 0
    is_safe: bool = True
    ml_available: bool = False


class BatchFilterRequest(BaseModel):
    """Toplu filtreleme isteği (blog içeriği + başlık + yorumlar)."""
    title: str | None = Field(None, max_length=500, description="Blog başlığı")
    content: str = Field(..., min_length=1, max_length=50000, description="Blog içeriği")
    comments: list[str] | None = Field(None, description="Yorumlar listesi")
    threshold: float = Field(0.5, ge=0.0, le=1.0)


class BatchFilterResponse(BaseModel):
    """Toplu filtreleme sonucu."""
    title: FilterResponse | None = None
    content: FilterResponse
    comments: list[FilterResponse] | None = None
    overall_safe: bool = True


class TitleRequest(BaseModel):
    """Başlık önerisi isteği."""
    content: str = Field(..., min_length=20, max_length=10000, description="Blog içeriği")
    category: str = Field("genel", description="Kategori: teknoloji, spor, ekonomi, vb.")
    num_suggestions: int = Field(3, ge=1, le=5, description="Kaç başlık önerilsin")
    temperature: float = Field(0.7, ge=0.1, le=1.5, description="Yaratıcılık seviyesi")


class TitleResponse(BaseModel):
    """Başlık önerisi sonucu."""
    titles: list[str]
    model_used: str        # "gpt2" | "fallback"
    category: str
    content_preview: str   # İçeriğin ilk 100 karakteri


# ── Endpointler ─────────────────────────────────────────

@router.post("/filter/profanity", response_model=FilterResponse)
async def filter_profanity(request: FilterRequest):
    """
    Tek bir metni filtrele.
    Hem kara liste hem ML model ile analiz yapar.
    """
    result = filter_text(request.text, profanity_threshold=request.threshold)
    return FilterResponse(**result)


@router.post("/filter/batch", response_model=BatchFilterResponse)
async def filter_batch(request: BatchFilterRequest):
    """
    Blog yazısını toplu filtrele: başlık + içerik + yorumlar.
    Her birini ayrı ayrı filtreler ve genel güvenlik durumunu belirler.
    """
    content_result = filter_text(request.content, profanity_threshold=request.threshold)
    content_response = FilterResponse(**content_result)

    title_response = None
    if request.title:
        title_result = filter_text(request.title, profanity_threshold=request.threshold)
        title_response = FilterResponse(**title_result)

    comment_responses = None
    if request.comments:
        comment_responses = []
        for comment in request.comments:
            comment_result = filter_text(comment, profanity_threshold=request.threshold)
            comment_responses.append(FilterResponse(**comment_result))

    overall_safe = content_response.is_safe
    if title_response and not title_response.is_safe:
        overall_safe = False
    if comment_responses:
        for cr in comment_responses:
            if not cr.is_safe:
                overall_safe = False
                break

    return BatchFilterResponse(
        title=title_response,
        content=content_response,
        comments=comment_responses,
        overall_safe=overall_safe,
    )


@router.post("/filter/analyze", response_model=FilterResponse)
async def analyze_text(request: FilterRequest):
    """
    Metni analiz et ama değiştirme (sadece skor ve bilgi ver).
    """
    result = filter_text(request.text, profanity_threshold=request.threshold)
    result["cleaned_text"] = result["original_text"]
    return FilterResponse(**result)


@router.post("/blog/suggest-title", response_model=TitleResponse)
async def suggest_title(request: TitleRequest):
    """
    Blog içeriğinden başlık önerileri üret.

    - Model eğitilmişse GPT-2 Turkish kullanır
    - Eğitilmemişse kural-tabanlı fallback öneriler döner
    """
    result = generate_titles(
        content=request.content,
        category=request.category,
        num_suggestions=request.num_suggestions,
        temperature=request.temperature,
    )
    return TitleResponse(
        titles=result["titles"],
        model_used=result["model_used"],
        category=result["category"],
        content_preview=request.content[:100],
    )
