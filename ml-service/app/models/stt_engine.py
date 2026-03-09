import logging
import os
import whisper
try:
    import moviepy.editor as mp
except ImportError:
    import moviepy as mp
from typing import Optional

logger = logging.getLogger(__name__)

class STTEngine:
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self.model: Optional[whisper.Whisper] = None
        self.initialized = False

    def load_model(self):
        """Whisper modelini yükler."""
        if not self.initialized:
            try:
                logger.info(f"Whisper modeli yükleniyor: {self.model_name}")
                self.model = whisper.load_model(self.model_name)
                self.initialized = True
                logger.info("Whisper modeli başarıyla yüklendi.")
            except Exception as e:
                logger.error(f"Whisper modeli yüklenirken hata: {e}")
                self.initialized = False

    def transcribe(self, file_path: str) -> str:
        """Ses veya video dosyasını metne dönüştürür."""
        if not self.initialized:
            self.load_model()
        
        if not self.model:
            return "STT model loading failed."

        temp_audio = None
        try:
            # Dosya uzantısını kontrol et, video ise sese dönüştür
            ext = os.path.splitext(file_path)[1].lower()
            if ext in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
                logger.info(f"Video dosyası tespit edildi, sese dönüştürülüyor: {file_path}")
                video = mp.VideoFileClip(file_path)
                temp_audio = file_path + ".wav"
                video.audio.write_audiofile(temp_audio, logger=None)
                target_path = temp_audio
            else:
                target_path = file_path

            logger.info(f"Transkripsiyon başlatılıyor: {target_path}")
            result = self.model.transcribe(target_path, language="tr")
            return result.get("text", "").strip()

        except Exception as e:
            logger.error(f"Transkripsiyon hatası: {e}")
            return f"Error: {str(e)}"
        finally:
            # Geçici ses dosyasını sil
            if temp_audio and os.path.exists(temp_audio):
                try:
                    os.remove(temp_audio)
                except:
                    pass

stt_engine = STTEngine()

def _load_stt_model():
    stt_engine.load_model()
