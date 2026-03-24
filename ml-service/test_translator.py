import sys
import os

# App dizinini path'e ekle
sys.path.append(os.path.abspath("d:/Downloads/Ai_asistan/ml-service"))

from app.utils.translator import translate_food_name

test_cases = [
    "Baked Pasta With Spinach Ricotta And Prosciutto",
    "Marinated Artichoke Kebabs",
    "What A Dhal",
    "Creamy Cauliflower Puree",
    "Roasted Chicken with Potatoes"
]

print("--- Translation Test ---")
for tc in test_cases:
    print(f"EN: {tc}")
    print(f"TR: {translate_food_name(tc)}")
    print("-" * 20)
