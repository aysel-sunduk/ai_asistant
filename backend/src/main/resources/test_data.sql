-- Alışveriş Öneri Sistemi Test Verileri (Zenginleştirilmiş)

-- 1. Kullanıcı ID'sini Bul
DO $$
DECLARE
    user_id_val UUID;
    list_id_1 UUID := gen_random_uuid();
    list_id_2 UUID := gen_random_uuid();
    list_id_3 UUID := gen_random_uuid();
BEGIN
    SELECT id INTO user_id_val FROM users LIMIT 1;

    -- 2. Alışveriş Listeleri Oluştur
    INSERT INTO shopping_lists (id, user_id, name, is_archived, recurrence_type, created_at) VALUES
    (list_id_1, user_id_val, 'Kahvaltı Hazırlığı', false, 'WEEKLY', now() - interval '3 days'),
    (list_id_2, user_id_val, 'Akşam Yemeği', true, 'DAILY', now() - interval '2 days'),
    (list_id_3, user_id_val, 'Genel Market', false, 'MONTHLY', now() - interval '1 day');

    -- 3. Ürünleri Ekle (Satın Alınmış Olarak)
    -- Kahvaltı Ürünleri (Kategorik İlişki İçin)
    INSERT INTO shopping_items (id, list_id, name, product_key, category, quantity, is_checked, added_at, checked_at) VALUES
    (gen_random_uuid(), list_id_1, 'Tam Yağlı Süt', 'SUT_1', 'SUT_URUNLERI', 2, true, now() - interval '3 days', now() - interval '70 hours'),
    (gen_random_uuid(), list_id_1, 'Beyaz Peynir', 'PEYNIR_1', 'SUT_URUNLERI', 1, true, now() - interval '3 days', now() - interval '69 hours'),
    (gen_random_uuid(), list_id_1, 'Zeytin', 'ZEYTIN_1', 'KAHVALTI', 1, true, now() - interval '3 days', now() - interval '68 hours'),
    (gen_random_uuid(), list_id_1, 'Yumurta 15li', 'YUMURTA_1', 'SUT_URUNLERI', 1, true, now() - interval '3 days', now() - interval '67 hours');

    -- Akşam Yemeği (Farklı Kategori)
    INSERT INTO shopping_items (id, list_id, name, product_key, category, quantity, is_checked, added_at, checked_at) VALUES
    (gen_random_uuid(), list_id_2, 'Makarna', 'MAKARNA_1', 'GIDA', 2, true, now() - interval '2 days', now() - interval '46 hours'),
    (gen_random_uuid(), list_id_2, 'Domates Salçası', 'SALCA_1', 'GIDA', 1, true, now() - interval '2 days', now() - interval '45 hours'),
    (gen_random_uuid(), list_id_2, 'Kıyma', 'ET_1', 'KASAP', 1, true, now() - interval '2 days', now() - interval '44 hours'),
    (gen_random_uuid(), list_id_2, 'Soğan', 'SOGAN_1', 'MANAV', 3, true, now() - interval '2 days', now() - interval '43 hours');

    -- Genel Market (Daha fazla veri)
    INSERT INTO shopping_items (id, list_id, name, product_key, category, quantity, is_checked, added_at, checked_at) VALUES
    (gen_random_uuid(), list_id_3, 'Ekmek', 'EKMEK_1', 'FIRIN', 3, true, now() - interval '1 day', now() - interval '20 hours'),
    (gen_random_uuid(), list_id_3, 'Çay', 'CAY_1', 'ICECEK', 1, true, now() - interval '1 day', now() - interval '19 hours'),
    (gen_random_uuid(), list_id_3, 'Şeker 1kg', 'SEKER_1', 'GIDA', 1, true, now() - interval '1 day', now() - interval '18 hours'),
    (gen_random_uuid(), list_id_3, 'Ayçiçek Yağı', 'YAG_1', 'GIDA', 1, true, now() - interval '1 day', now() - interval '17 hours'),
    (gen_random_uuid(), list_id_3, 'Tuvalet Kağıdı', 'TEMIZLIK_1', 'TEMIZLIK', 1, true, now() - interval '1 day', now() - interval '16 hours'),
    (gen_random_uuid(), list_id_3, 'Diş Macunu', 'KOZMETIK_1', 'KOZMETIK', 1, true, now() - interval '1 day', now() - interval '15 hours'),
    (gen_random_uuid(), list_id_3, 'Bulaşık Deterjanı', 'TEMIZLIK_2', 'TEMIZLIK', 1, true, now() - interval '1 day', now() - interval '14 hours');

END $$;
