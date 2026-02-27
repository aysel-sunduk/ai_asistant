-- Shopping recommendation icin gerekli kolonlar:
-- - product_key: urun adinin normalize hali (modelde stable item kimligi)
-- - category: urun kategori etiketi
-- - added_at: urunun listeye eklenme zamani
-- - checked_at: urunun satin alindigi (check) zamani

ALTER TABLE IF EXISTS public.shopping_items
ADD COLUMN IF NOT EXISTS product_key varchar(160);

ALTER TABLE IF EXISTS public.shopping_items
ADD COLUMN IF NOT EXISTS category varchar(80);

ALTER TABLE IF EXISTS public.shopping_items
ADD COLUMN IF NOT EXISTS added_at timestamptz;

ALTER TABLE IF EXISTS public.shopping_items
ADD COLUMN IF NOT EXISTS checked_at timestamptz;

UPDATE public.shopping_items si
SET product_key = lower(regexp_replace(btrim(coalesce(si.name, '')), '\s+', ' ', 'g'))
WHERE si.product_key IS NULL OR btrim(si.product_key) = '';

UPDATE public.shopping_items si
SET added_at = coalesce(sl.created_at, now())
FROM public.shopping_lists sl
WHERE sl.id = si.list_id
  AND si.added_at IS NULL;

UPDATE public.shopping_items si
SET checked_at = coalesce(si.checked_at, sl.created_at, now())
FROM public.shopping_lists sl
WHERE sl.id = si.list_id
  AND si.is_checked = true
  AND si.checked_at IS NULL;

ALTER TABLE IF EXISTS public.shopping_items
ALTER COLUMN product_key SET NOT NULL;

ALTER TABLE IF EXISTS public.shopping_items
ALTER COLUMN added_at SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_shopping_items_product_key_not_empty'
    ) THEN
        ALTER TABLE public.shopping_items
        ADD CONSTRAINT chk_shopping_items_product_key_not_empty
        CHECK (btrim(product_key) <> '');
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_shopping_items_product_key
    ON public.shopping_items (product_key);

CREATE INDEX IF NOT EXISTS idx_shopping_items_checked_at
    ON public.shopping_items (checked_at)
    WHERE is_checked = true;

