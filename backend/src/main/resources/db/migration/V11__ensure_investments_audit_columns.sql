-- Ensure investments table has BaseEntity audit columns expected by JPA mappings.

ALTER TABLE IF EXISTS public.investments
ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE public.investments
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

ALTER TABLE IF EXISTS public.investments
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE IF EXISTS public.investments
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE IF EXISTS public.investments
ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.investments
SET updated_at = COALESCE(updated_at, now())
WHERE updated_at IS NULL;

ALTER TABLE IF EXISTS public.investments
ALTER COLUMN updated_at SET DEFAULT now();
