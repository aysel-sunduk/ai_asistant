-- Make users.visibility the source of truth for privacy.

ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS visibility varchar(16);

UPDATE public.users
SET visibility = 'public'
WHERE visibility IS NULL OR length(trim(visibility)) = 0;

-- Best-effort sync from user_profiles if a user has explicit private visibility there.
UPDATE public.users u
SET visibility = lower(trim(up.profile_visibility))
FROM public.user_profiles up
WHERE up.user_id = u.id
  AND up.profile_visibility IS NOT NULL
  AND lower(trim(up.profile_visibility)) IN ('public', 'private');

ALTER TABLE IF EXISTS public.users
    ALTER COLUMN visibility SET DEFAULT 'public';

ALTER TABLE IF EXISTS public.users
    ALTER COLUMN visibility SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_visibility_allowed'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT chk_users_visibility_allowed
            CHECK (visibility IN ('public', 'private'));
    END IF;
END $$;
