from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.food_analyzer import analyzer
import io

router = APIRouter()

@router.post("/analyze-food")
async def analyze_food(file: UploadFile = File(...)):
    """Resim üzerinden yemek analizi yapar."""
    if not analyzer.initialized:
        raise HTTPException(status_code=503, detail="Yemek analiz modeli henüz yüklenmedi.")
        
    try:
        contents = await file.read()
        image_stream = io.BytesIO(contents)
        result = analyzer.analyze(image_stream)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analiz sırasında hata: {str(e)}")
