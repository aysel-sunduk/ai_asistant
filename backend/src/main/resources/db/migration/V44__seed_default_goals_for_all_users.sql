-- Seed default goals for active users so Goals screen has initial data.
-- Idempotent by (user_id, title) existence check.

INSERT INTO public.goals (
    id,
    user_id,
    title,
    description,
    category,
    target_date,
    progress_pct,
    is_completed,
    milestones,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    u.id,
    g.title,
    g.description,
    g.category,
    g.target_date,
    g.progress_pct,
    g.is_completed,
    g.milestones,
    now(),
    now()
FROM public.users u
CROSS JOIN (
    VALUES
        (
            'Haftada 3 gun spor yap',
            'Duzenli egzersiz rutini olustur.',
            'health',
            CURRENT_DATE + INTERVAL '45 days',
            35,
            false,
            '[{"title":"Spor programi sec","isCompleted":true},{"title":"Ilk 10 antrenmani tamamla","isCompleted":false}]'::jsonb
        ),
        (
            'Aylik tasarruf hedefi',
            'Her ay gelirden planli birikim yap.',
            'finance',
            CURRENT_DATE + INTERVAL '60 days',
            20,
            false,
            '[{"title":"Butce tablosu hazirla","isCompleted":true},{"title":"Otomatik aktarim ayarla","isCompleted":false}]'::jsonb
        ),
        (
            '24 kitaplik okuma listesi',
            'Yil sonuna kadar 24 kitap bitir.',
            'personal',
            CURRENT_DATE + INTERVAL '180 days',
            50,
            false,
            '[{"title":"Okuma listesi olustur","isCompleted":true},{"title":"Ilk 12 kitabi tamamla","isCompleted":false}]'::jsonb
        )
) AS g(title, description, category, target_date, progress_pct, is_completed, milestones)
WHERE u.is_active = true
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.goals existing
      WHERE existing.user_id = u.id
        AND existing.title = g.title
  );
