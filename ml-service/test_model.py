import sys
sys.path.insert(0, r"d:\Downloads\Ai_asistan\ml-service")

from app.models.investment_recommender import _load_models, recommend_for_user, get_risk_profile, is_model_loaded

# Load models
ok = _load_models()
print(f"Model yukleme: {ok}")
print(f"Model durumu: {is_model_loaded()}")

# Test 1: Risk profili
risk = get_risk_profile({
    "avg_monthly_expense": 5000,
    "savings_ratio": 0.2,
    "investment_count": 3,
    "total_investment_value": 50000,
    "favorite_count": 4,
})
print(f"Risk profili: {risk['segment']} ({risk['segment_tr']}) - method: {risk['method']}")

# Test 2: Oneri al
result = recommend_for_user(
    user_id="user-0080",
    user_data={"avg_monthly_expense": 5000, "savings_ratio": 0.2, "investment_count": 3, "total_investment_value": 50000},
    user_holdings={"USD/TRY": {"quantity": 100, "value": 3300, "asset_type": "CURRENCY", "risk_level": "LOW"}},
    user_favorites=["USD/TRY", "EUR/TRY", "XAU/TRY"],
    top_k=5,
)
print(f"Method: {result['method']}")
print(f"Oneri sayisi: {len(result['recommendations'])}")
for r in result["recommendations"]:
    print(f"  {r['recommendationType']:4s} | {r['symbol']:10s} | Guven: {r['confidenceScore']:5.1f}% | {r['riskLevel']}")
    print(f"       -> {r['reason']}")

print("\nTEST BASARILI!")
