"""
Yatırım Öneri Modeli — Eğitim Script'i
Bu script sentetik veri oluşturur ve 3 katmanlı hibrit modeli eğitir.
Google Colab veya yerel ortamda çalıştırılabilir.

Kullanım:
  python train_investment_recommender.py

Veya Colab'da:
  !python train_investment_recommender.py
"""

import sys
import os
import numpy as np
import pandas as pd
from pathlib import Path

# ml-service root'unu path'e ekle
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

print("=" * 60)
print("  Yatırım Öneri Modeli — Eğitim Başlıyor")
print("=" * 60)


# ═══════════════════════════════════════════════════════════════════
# ADIM 1: SENTETİK VERİ OLUŞTURMA
# ═══════════════════════════════════════════════════════════════════

print("\n📊 Adım 1: Sentetik veri oluşturuluyor...")

np.random.seed(42)

N_USERS = 200
SYMBOLS = [
    "USD/TRY", "EUR/TRY", "GBP/TRY", "JPY/TRY", "CHF/TRY",
    "XAU/TRY", "XAG/TRY",
    "BTC/USD", "ETH/USD", "BNB/USD",
    "EUR/USD", "GBP/USD",
    "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA",
]

ASSET_TYPES = {
    "USD/TRY": "CURRENCY", "EUR/TRY": "CURRENCY", "GBP/TRY": "CURRENCY",
    "JPY/TRY": "CURRENCY", "CHF/TRY": "CURRENCY", "EUR/USD": "CURRENCY",
    "GBP/USD": "CURRENCY",
    "XAU/TRY": "METAL", "XAG/TRY": "METAL",
    "BTC/USD": "CRYPTO", "ETH/USD": "CRYPTO", "BNB/USD": "CRYPTO",
    "AAPL": "STOCK", "GOOGL": "STOCK", "MSFT": "STOCK",
    "AMZN": "STOCK", "TSLA": "STOCK",
}

RISK_LEVELS = {
    "CURRENCY": "LOW", "METAL": "MEDIUM", "CRYPTO": "HIGH", "STOCK": "MEDIUM",
}

# ── Kullanıcı feature'ları oluştur ──
user_ids = [f"user-{i:04d}" for i in range(N_USERS)]

# 3 profil tipi: Conservative (%40), Moderate (%35), Aggressive (%25)
profiles = (
    ["conservative"] * 80
    + ["moderate"] * 70
    + ["aggressive"] * 50
)
np.random.shuffle(profiles)

user_features_data = []
for i, uid in enumerate(user_ids):
    profile = profiles[i]

    if profile == "conservative":
        avg_exp = np.random.uniform(2000, 5000)
        exp_vol = np.random.uniform(200, 800)
        savings = np.random.uniform(0.15, 0.35)
        cat_div = np.random.randint(3, 6)
        inv_count = np.random.randint(0, 3)
        inv_value = np.random.uniform(0, 30000)
        fav_count = np.random.randint(0, 4)
    elif profile == "moderate":
        avg_exp = np.random.uniform(3000, 8000)
        exp_vol = np.random.uniform(500, 1500)
        savings = np.random.uniform(0.10, 0.30)
        cat_div = np.random.randint(4, 8)
        inv_count = np.random.randint(2, 6)
        inv_value = np.random.uniform(10000, 100000)
        fav_count = np.random.randint(2, 8)
    else:  # aggressive
        avg_exp = np.random.uniform(5000, 15000)
        exp_vol = np.random.uniform(1000, 3000)
        savings = np.random.uniform(0.05, 0.25)
        cat_div = np.random.randint(5, 9)
        inv_count = np.random.randint(4, 12)
        inv_value = np.random.uniform(50000, 500000)
        fav_count = np.random.randint(5, 15)

    user_features_data.append({
        "user_id": uid,
        "avg_monthly_expense": round(avg_exp, 2),
        "expense_volatility": round(exp_vol, 2),
        "savings_ratio": round(savings, 3),
        "category_diversity": cat_div,
        "investment_count": inv_count,
        "total_investment_value": round(inv_value, 2),
        "favorite_count": fav_count,
        "_profile": profile,  # eğitim doğrulaması için
    })

user_features_df = pd.DataFrame(user_features_data)
print(f"  ✅ {len(user_features_df)} kullanıcı feature'ı oluşturuldu")
print(f"  Profil dağılımı: {user_features_df['_profile'].value_counts().to_dict()}")


# ── Interaction verisi oluştur ──
# Puanlama: favorite=3, portfolio=2, viewed=1

interactions_data = []
for i, uid in enumerate(user_ids):
    profile = profiles[i]

    # Profiline göre hangi araçları tercih eder
    if profile == "conservative":
        preferred = ["USD/TRY", "EUR/TRY", "GBP/TRY", "XAU/TRY", "EUR/USD"]
        weights = [0.30, 0.25, 0.15, 0.20, 0.10]
    elif profile == "moderate":
        preferred = ["USD/TRY", "EUR/TRY", "XAU/TRY", "XAG/TRY", "AAPL", "MSFT", "BTC/USD"]
        weights = [0.20, 0.15, 0.15, 0.10, 0.15, 0.15, 0.10]
    else:
        preferred = ["BTC/USD", "ETH/USD", "BNB/USD", "TSLA", "XAU/TRY", "AMZN"]
        weights = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10]

    # Her kullanıcı 3-10 araçla etkileşime girer
    n_interactions = np.random.randint(3, min(11, len(preferred) + 5))

    # Tercih edilen araçlardan seç
    chosen_preferred = np.random.choice(
        preferred,
        size=min(n_interactions, len(preferred)),
        replace=False,
        p=weights[:len(preferred)] / np.sum(weights[:len(preferred)]),
    )

    for symbol in chosen_preferred:
        score = np.random.choice([1, 2, 3], p=[0.2, 0.4, 0.4])
        interactions_data.append({
            "user_id": uid,
            "symbol": symbol,
            "score": float(score),
        })

    # Rastgele birkaç ek araç ekle
    remaining = [s for s in SYMBOLS if s not in chosen_preferred]
    n_extra = max(0, n_interactions - len(chosen_preferred))
    if n_extra > 0 and len(remaining) > 0:
        extras = np.random.choice(remaining, size=min(n_extra, len(remaining)), replace=False)
        for symbol in extras:
            score = np.random.choice([1, 2], p=[0.6, 0.4])
            interactions_data.append({
                "user_id": uid,
                "symbol": symbol,
                "score": float(score),
            })

interactions_df = pd.DataFrame(interactions_data)
print(f"  ✅ {len(interactions_df)} interaction kaydı oluşturuldu")
print(f"  Benzersiz kullanıcı: {interactions_df['user_id'].nunique()}")
print(f"  Benzersiz araç: {interactions_df['symbol'].nunique()}")


# ── Asset feature'ları oluştur ──
asset_features_data = []
for symbol in SYMBOLS:
    asset_type = ASSET_TYPES.get(symbol, "CURRENCY")
    risk_level = RISK_LEVELS.get(asset_type, "MEDIUM")

    if asset_type == "CRYPTO":
        volatility = np.random.uniform(0.3, 0.8)
        trend = np.random.uniform(-0.5, 0.5)
        daily_change = np.random.uniform(-5, 5)
    elif asset_type == "STOCK":
        volatility = np.random.uniform(0.1, 0.4)
        trend = np.random.uniform(-0.3, 0.4)
        daily_change = np.random.uniform(-3, 3)
    elif asset_type == "METAL":
        volatility = np.random.uniform(0.05, 0.25)
        trend = np.random.uniform(-0.2, 0.3)
        daily_change = np.random.uniform(-2, 2)
    else:  # CURRENCY
        volatility = np.random.uniform(0.02, 0.15)
        trend = np.random.uniform(-0.1, 0.2)
        daily_change = np.random.uniform(-1.5, 1.5)

    asset_features_data.append({
        "symbol": symbol,
        "volatility_30d": round(volatility, 4),
        "trend_score": round(trend, 4),
        "daily_change_pct": round(daily_change, 4),
        "asset_type": asset_type,
        "risk_level": risk_level,
    })

asset_features_df = pd.DataFrame(asset_features_data).set_index("symbol")
print(f"  ✅ {len(asset_features_df)} asset feature kaydı oluşturuldu")


# ═══════════════════════════════════════════════════════════════════
# ADIM 2: MODEL EĞİTİMİ
# ═══════════════════════════════════════════════════════════════════

print("\n🧠 Adım 2: Model eğitimi başlıyor...")

from app.models.investment_recommender import (
    train_risk_model,
    train_cf_model,
    save_asset_features,
    _load_models,
    recommend_for_user,
    get_risk_profile,
)

# Risk Profili KMeans
print("\n  📌 Risk profili modeli eğitiliyor...")
risk_result = train_risk_model(user_features_df)
print(f"  ✅ Risk modeli eğitildi:")
print(f"     Cluster boyutları: {risk_result['cluster_sizes']}")
print(f"     Inertia: {risk_result['inertia']}")

# Collaborative Filtering SVD
print("\n  📌 Collaborative filtering modeli eğitiliyor...")
cf_result = train_cf_model(interactions_df, n_factors=15)
print(f"  ✅ CF modeli eğitildi:")
print(f"     {cf_result['n_users']} kullanıcı, {cf_result['n_items']} araç")
print(f"     Açıklanan varyans: {cf_result['explained_variance']:.1%}")

# Asset Features
print("\n  📌 Asset feature'ları kaydediliyor...")
af_result = save_asset_features(asset_features_df)
print(f"  ✅ {af_result['n_assets']} asset feature kaydedildi")


# ═══════════════════════════════════════════════════════════════════
# ADIM 3: MODELLERİ YÜKLE VE TEST ET
# ═══════════════════════════════════════════════════════════════════

print("\n🧪 Adım 3: Model doğrulama...")

# Modelleri yükle
loaded = _load_models()
print(f"  Model yükleme: {'✅ Başarılı' if loaded else '❌ Başarısız'}")

# Test kullanıcıları
test_users = [
    {
        "name": "Muhafazakar Yatırımcı",
        "user_id": "user-0001",
        "user_data": {
            "avg_monthly_expense": 3000,
            "expense_volatility": 400,
            "savings_ratio": 0.25,
            "category_diversity": 4,
            "investment_count": 1,
            "total_investment_value": 15000,
            "favorite_count": 2,
        },
        "holdings": {"USD/TRY": {"quantity": 500, "value": 16500, "asset_type": "CURRENCY", "risk_level": "LOW"}},
        "favorites": ["USD/TRY", "EUR/TRY"],
    },
    {
        "name": "Dengeli Yatırımcı",
        "user_id": "user-0080",
        "user_data": {
            "avg_monthly_expense": 6000,
            "expense_volatility": 1000,
            "savings_ratio": 0.20,
            "category_diversity": 6,
            "investment_count": 4,
            "total_investment_value": 75000,
            "favorite_count": 5,
        },
        "holdings": {
            "USD/TRY": {"quantity": 300, "value": 9900, "asset_type": "CURRENCY", "risk_level": "LOW"},
            "XAU/TRY": {"quantity": 10, "value": 30000, "asset_type": "METAL", "risk_level": "MEDIUM"},
            "AAPL": {"quantity": 5, "value": 1100, "asset_type": "STOCK", "risk_level": "MEDIUM"},
        },
        "favorites": ["USD/TRY", "XAU/TRY", "EUR/TRY", "BTC/USD", "MSFT"],
    },
    {
        "name": "Agresif Yatırımcı",
        "user_id": "user-0150",
        "user_data": {
            "avg_monthly_expense": 10000,
            "expense_volatility": 2500,
            "savings_ratio": 0.10,
            "category_diversity": 7,
            "investment_count": 8,
            "total_investment_value": 250000,
            "favorite_count": 12,
        },
        "holdings": {
            "BTC/USD": {"quantity": 0.5, "value": 30000, "asset_type": "CRYPTO", "risk_level": "HIGH"},
            "ETH/USD": {"quantity": 5, "value": 15000, "asset_type": "CRYPTO", "risk_level": "HIGH"},
            "TSLA": {"quantity": 20, "value": 5000, "asset_type": "STOCK", "risk_level": "HIGH"},
            "XAU/TRY": {"quantity": 50, "value": 150000, "asset_type": "METAL", "risk_level": "MEDIUM"},
        },
        "favorites": ["BTC/USD", "ETH/USD", "TSLA", "XAU/TRY", "AMZN", "BNB/USD"],
    },
]

for test in test_users:
    print(f"\n  {'─' * 50}")
    print(f"  🧑 {test['name']} (ID: {test['user_id']})")

    # Risk profili
    risk = get_risk_profile(test["user_data"])
    print(f"  Risk: {risk['segment']} ({risk['segment_tr']}) [{risk['method']}]")

    # Öneriler
    result = recommend_for_user(
        user_id=test["user_id"],
        user_data=test["user_data"],
        user_holdings=test["holdings"],
        user_favorites=test["favorites"],
        interactions_df=interactions_df,
        top_k=5,
    )

    print(f"  Yöntem: {result['method']}")
    print(f"  Top-5 Öneriler:")
    for rec in result["recommendations"]:
        action_icon = {"BUY": "🟢", "HOLD": "🟡", "SELL": "🔴"}.get(rec["recommendationType"], "⚪")
        print(
            f"    {action_icon} {rec['recommendationType']:4s} | "
            f"{rec['symbol']:10s} | "
            f"Güven: {rec['confidenceScore']:5.1f}% | "
            f"Risk: {rec['riskLevel']:6s} | "
            f"Portföy: {'✓' if rec['inPortfolio'] else '✗'}"
        )
        print(f"      → {rec['reason']}")


# ═══════════════════════════════════════════════════════════════════
# ADIM 4: ÖZET
# ═══════════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("  ✅ EĞİTİM TAMAMLANDI")
print("=" * 60)
print(f"\n  Kaydedilen model dosyaları:")

MODEL_DIR = SCRIPT_DIR / "app" / "models_saved" / "investment_recommender"
if MODEL_DIR.exists():
    for f in sorted(MODEL_DIR.iterdir()):
        size_kb = f.stat().st_size / 1024
        print(f"    📁 {f.name} ({size_kb:.1f} KB)")

print(f"\n  Kullanım:")
print(f"    1. ML servisi başlat: uvicorn app.main:app --reload")
print(f"    2. Durum kontrolü: GET /health")
print(f"    3. Öneri al: POST /api/finance/recommendations/user")
print(f"    4. Risk profili: POST /api/finance/recommendations/risk-profile")
