import logging
import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.stt_engine import stt_engine

logger = logging.getLogger(__name__)
router = APIRouter(tags=["STT"])

@router.post("/stt/transcribe")
async def transcribe_audio_video(file: UploadFile = File(...)):
    """Ses veya video dosyasını metne dönüştürür (Speech-to-Text)."""
    
    # Geçici bir dosya oluştur
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        try:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        except Exception as e:
            logger.error(f"Dosya kaydedilemedi: {e}")
            raise HTTPException(status_code=500, detail="Dosya kaydedilemedi")

    try:
        logger.info(f"STT işlemi başlatılıyor: {file.filename}")
        transcription = stt_engine.transcribe(tmp_path)
        
        if "STT model loading failed" in transcription or "Error:" in transcription:
            raise HTTPException(status_code=500, detail=transcription)
            
        return {
            "success": True,
            "filename": file.filename,
            "transcription": transcription
        }
    finally:
        # Geçici dosyayı sil
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except:
                pass
