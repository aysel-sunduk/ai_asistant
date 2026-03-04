-- Seed AI investment recommendations for frontend display
INSERT INTO investment_recommendations (id, recommendation_type, asset_type, symbol, confidence_score, reason, risk_level, target_price, valid_until, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'BUY', 'CURRENCY', 'EUR/TRY', 78.50, 'Euro, portföy çeşitlendirmesi için güçlü bir seçenek. Düşük volatilite ve stabil getiri potansiyeli taşıyor.', 'LOW', 52.50, NOW() + INTERVAL '30 days', NOW(), NOW()),
  (gen_random_uuid(), 'BUY', 'CURRENCY', 'USD/TRY', 72.30, 'Dolar küresel rezerv para birimi olarak güvenli liman özelliği taşıyor. Risk profilinize uygun.', 'LOW', 45.00, NOW() + INTERVAL '30 days', NOW(), NOW()),
  (gen_random_uuid(), 'HOLD', 'METAL', 'XAU/TRY', 85.00, 'Altın fiyatları yüksek seviyelerde, mevcut pozisyonu korumak mantıklı. Satış için henüz erken.', 'MEDIUM', 3200.00, NOW() + INTERVAL '30 days', NOW(), NOW()),
  (gen_random_uuid(), 'BUY', 'METAL', 'XAG/TRY', 65.80, 'Gümüş, altına göre daha yüksek getiri potansiyeli sunuyor. Orta vadeli yatırım için uygun.', 'MEDIUM', 38.50, NOW() + INTERVAL '30 days', NOW(), NOW()),
  (gen_random_uuid(), 'SELL', 'CURRENCY', 'GBP/TRY', 60.20, 'Sterlin son dönemde aşırı değerlenmiş görünüyor. Kâr realizasyonu için uygun zaman.', 'HIGH', 55.00, NOW() + INTERVAL '30 days', NOW(), NOW())
ON CONFLICT DO NOTHING;
