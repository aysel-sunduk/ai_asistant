-- Eger V63 bir sekilde uygulanmadiysa, is_favorite sutununu guvenli bir sekilde ekleyelim.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'health_logs' AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE health_logs ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
