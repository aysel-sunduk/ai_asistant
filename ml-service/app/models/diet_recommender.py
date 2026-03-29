"""
Diyet Öneri Sistemi — ML Model Modülü
Eğitilmiş tarif veritabanını yükler ve kişiselleştirilmiş günlük öğün planı önerir.
"""

import os
import json
import pickle
import random
import logging
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from app.utils.translator import translate_food_name

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════
# MAKRO HEDEFLERİ ve ÖĞÜN DAĞILIMI
# ═══════════════════════════════════════════════════════════════════

MACRO_RATIOS = {
    'LOSE_WEIGHT': {'protein': 0.30, 'carbs': 0.40, 'fat': 0.30},
    'MAINTAIN':    {'protein': 0.25, 'carbs': 0.50, 'fat': 0.25},
    'GAIN_WEIGHT': {'protein': 0.30, 'carbs': 0.45, 'fat': 0.25},
}

MEAL_SLOTS = [
    {'slot': 'BREAKFAST',  'ratio': 0.25, 'filter_type': 'BREAKFAST'},
    {'slot': 'SNACK_AM',   'ratio': 0.10, 'filter_type': 'SNACK'},
    {'slot': 'LUNCH',      'ratio': 0.30, 'filter_type': 'LUNCH'},
    {'slot': 'SNACK_PM',   'ratio': 0.05, 'filter_type': 'SNACK'},
    {'slot': 'DINNER',     'ratio': 0.30, 'filter_type': 'DINNER'},
]

SLOT_LABELS_TR = {
    'BREAKFAST': 'Kahvaltı',
    'SNACK_AM': 'Ara Öğün (Sabah)',
    'LUNCH': 'Öğle Yemeği',
    'SNACK_PM': 'Ara Öğün (Öğleden Sonra)',
    'DINNER': 'Akşam Yemeği',
}


# ═══════════════════════════════════════════════════════════════════
# MODEL SINIFI
# ═══════════════════════════════════════════════════════════════════

class DietRecommender:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DietRecommender, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def initialize(self, model_dir: str):
        """Eğitilmiş modelleri yükle."""
        if self.initialized:
            return

        recipe_path = os.path.join(model_dir, "recipe_database.pkl")
        scaler_path = os.path.join(model_dir, "nutrition_scaler.pkl")
        meta_path = os.path.join(model_dir, "diet_model_metadata.json")

        if not os.path.exists(recipe_path):
            logger.warning(f"Tarif veritabanı bulunamadı: {recipe_path}")
            return

        # Tarif veritabanı
        self.recipe_db = pd.read_pickle(recipe_path)
        logger.info(f"Tarif veritabanı yüklendi: {len(self.recipe_db)} tarif")

        # Scaler
        if os.path.exists(scaler_path):
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            logger.info("Nutrition scaler yüklendi")
        else:
            logger.warning("Scaler bulunamadı, varsayılan kullanılacak")
            self.scaler = None

        # Metadata
        if os.path.exists(meta_path):
            with open(meta_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
            logger.info(f"Metadata yüklendi: {self.metadata.get('total_recipes', '?')} tarif")
        else:
            self.metadata = {}

        self.initialized = True
        logger.info(f"✅ DietRecommender başlatıldı ({len(self.recipe_db)} tarif)")

    def recommend_daily_plan(
        self,
        calorie_target: int,
        diet_goal: str = "MAINTAIN",
        allergies: list = None,
        preference: str = "NORMAL",
        excluded_foods: list = None,
        favorite_foods: list = None
    ) -> dict:
        """Kişiselleştirilmiş günlük öğün planı oluştur."""

        if not self.initialized:
            raise RuntimeError("Model henüz yüklenmedi")

        allergies = allergies or []
        excluded_foods = excluded_foods or []
        diet_goal = diet_goal.upper()

        # Makro hedefler
        ratios = MACRO_RATIOS.get(diet_goal, MACRO_RATIOS['MAINTAIN'])

        total_protein_target = (calorie_target * ratios['protein']) / 4  # gram
        total_carbs_target = (calorie_target * ratios['carbs']) / 4
        total_fat_target = (calorie_target * ratios['fat']) / 9

        meals = []
        used_recipe_ids = set()
        total_cal = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0

        for slot_info in MEAL_SLOTS:
            slot = slot_info['slot']
            slot_cal = calorie_target * slot_info['ratio']
            filter_type = slot_info['filter_type']

            # Bu slot için yemek seç
            recipe = self._select_recipe(
                slot_cal=slot_cal,
                ratios=ratios,
                meal_type=filter_type,
                preference=preference,
                excluded_foods=excluded_foods,
                favorite_foods=favorite_foods,
                used_ids=used_recipe_ids
            )

            if recipe is not None:
                used_recipe_ids.add(recipe['id'])
                total_cal += recipe['calories']
                total_protein += recipe['protein']
                total_carbs += recipe['carbs']
                total_fat += recipe['fat']

                meals.append({
                    'slot': slot,
                    'slot_label': SLOT_LABELS_TR.get(slot, slot),
                    'recipe_id': int(recipe['id']),
                    'name': translate_food_name(recipe['name']),
                    'calories': round(recipe['calories'], 1),
                    'protein': round(recipe['protein'], 1),
                    'fat': round(recipe['fat'], 1),
                    'carbs': round(recipe['carbs'], 1),
                    'prep_minutes': int(recipe.get('minutes', 0)),
                    'similarity_score': round(recipe.get('similarity', 0), 3),
                })
            else:
                meals.append({
                    'slot': slot,
                    'slot_label': SLOT_LABELS_TR.get(slot, slot),
                    'recipe_id': None,
                    'name': 'Uygun tarif bulunamadı',
                    'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0,
                    'prep_minutes': 0, 'similarity_score': 0,
                })

        # Makro özeti
        macro_summary = {}
        if total_cal > 0:
            macro_summary = {
                'protein_pct': round((total_protein * 4 / total_cal) * 100, 1),
                'carbs_pct': round((total_carbs * 4 / total_cal) * 100, 1),
                'fat_pct': round((total_fat * 9 / total_cal) * 100, 1),
            }

        return {
            'daily_plan': {
                'calorie_target': calorie_target,
                'total_calories': round(total_cal, 1),
                'total_protein': round(total_protein, 1),
                'total_carbs': round(total_carbs, 1),
                'total_fat': round(total_fat, 1),
                'diet_goal': diet_goal,
                'meals': meals,
            },
            'macro_summary': macro_summary,
            'metadata': {
                'total_recipes_in_db': len(self.recipe_db),
                'preference': preference,
            }
        }

    def swap_meal(
        self,
        slot: str,
        calorie_target: int,
        diet_goal: str = "MAINTAIN",
        excluded_recipe_ids: list = None,
        preference: str = "NORMAL",
        favorite_foods: list = None
    ) -> dict:
        """Belirli bir slot için alternatif yemek öner."""

        if not self.initialized:
            raise RuntimeError("Model henüz yüklenmedi")

        excluded_recipe_ids = excluded_recipe_ids or []
        diet_goal = diet_goal.upper()
        ratios = MACRO_RATIOS.get(diet_goal, MACRO_RATIOS['MAINTAIN'])

        # Slot bilgisini bul
        slot_info = next((s for s in MEAL_SLOTS if s['slot'] == slot), None)
        if slot_info is None:
            # Fallback
            slot_info = {'ratio': 0.25, 'filter_type': 'LUNCH'}

        slot_cal = calorie_target * slot_info['ratio']

        recipe = self._select_recipe(
            slot_cal=slot_cal,
            ratios=ratios,
            meal_type=slot_info['filter_type'],
            preference=preference,
            excluded_foods=[],
            favorite_foods=favorite_foods,
            used_ids=set(excluded_recipe_ids)
        )

        if recipe is not None:
            return {
                'slot': slot,
                'slot_label': SLOT_LABELS_TR.get(slot, slot),
                'recipe_id': int(recipe['id']),
                'name': translate_food_name(recipe['name']),
                'calories': round(recipe['calories'], 1),
                'protein': round(recipe['protein'], 1),
                'fat': round(recipe['fat'], 1),
                'carbs': round(recipe['carbs'], 1),
                'prep_minutes': int(recipe.get('minutes', 0)),
                'similarity_score': round(recipe.get('similarity', 0), 3),
            }
        else:
            return {
                'slot': slot,
                'slot_label': SLOT_LABELS_TR.get(slot, slot),
                'recipe_id': None,
                'name': 'Alternatif tarif bulunamadı',
                'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0,
                'prep_minutes': 0, 'similarity_score': 0,
            }

    def _select_recipe(self, slot_cal, ratios, meal_type, preference, excluded_foods, favorite_foods, used_ids):
        """Cosine similarity ile en uygun tarifi seç. Favori yemeklere boost uygular."""

        # Öğün tipine göre filtrele
        candidates = self.recipe_db[self.recipe_db['meal_type'] == meal_type].copy()

        # Kullanılmış tarifleri çıkar
        if used_ids:
            candidates = candidates[~candidates['id'].isin(used_ids)]

        # Kalori aralığı (±%30)
        cal_min = slot_cal * 0.70
        cal_max = slot_cal * 1.30
        candidates = candidates[(candidates['calories'] >= cal_min) & (candidates['calories'] <= cal_max)]

        # Diyet tercihi filtresi
        if preference and preference != 'NORMAL':
            pref_upper = preference.upper()
            candidates_pref = candidates[
                candidates['diet_labels'].apply(lambda labels: pref_upper in labels)
            ]
            if len(candidates_pref) >= 5:
                candidates = candidates_pref

        if len(candidates) == 0:
            return None

        # Hedef besin vektörü
        target_protein = (slot_cal * ratios['protein']) / 4
        target_carbs = (slot_cal * ratios['carbs']) / 4
        target_fat = (slot_cal * ratios['fat']) / 9

        target_raw = np.array([[slot_cal, target_protein, target_fat, target_carbs]])

        if self.scaler:
            target_norm = self.scaler.transform(target_raw)
        else:
            target_norm = target_raw

        candidate_vecs = candidates[['cal_norm', 'prot_norm', 'fat_norm', 'carb_norm']].values
        similarities = cosine_similarity(target_norm, candidate_vecs)[0]
        candidates = candidates.copy()
        candidates['similarity'] = similarities

        # Favori Boost: Eğer yemek ismi favorilerde varsa skoru artır
        if favorite_foods:
            def apply_fav_boost(row):
                # Orijinal veya çevrilmiş isim favorilerde mevcut mu?
                translated = translate_food_name(row['name'])
                if any(fav.lower() in translated.lower() or fav.lower() in row['name'].lower() for fav in favorite_foods):
                    return row['similarity'] + 0.25 # %25 boost
                return row['similarity']

            candidates['similarity'] = candidates.apply(apply_fav_boost, axis=1)

        # Top-10'dan rastgele seç (çeşitlilik için)
        top_n = min(10, len(candidates))
        top_candidates = candidates.nlargest(top_n, 'similarity')

        # Ağırlıklı rastgele seçim (benzerliğe göre)
        weights = top_candidates['similarity'].values
        weights = weights / weights.sum()
        chosen_idx = np.random.choice(len(top_candidates), p=weights)
        chosen = top_candidates.iloc[chosen_idx]

        return chosen


# Singleton instance
recommender = DietRecommender()


def is_model_loaded() -> bool:
    return recommender.initialized


def _load_models():
    """Modelleri yükle."""
    model_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "models_saved", "diet_recommender"
    )
    model_dir = os.path.normpath(model_dir)

    if os.path.exists(model_dir):
        recommender.initialize(model_dir)
    else:
        logger.warning(f"Diet recommender model dizini bulunamadı: {model_dir}")
