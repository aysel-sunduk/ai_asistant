-- ============================================================
-- Add audit columns to reminders table
-- created_at & updated_at (BaseEntity uyumu için)
-- ============================================================

Alter table reminders
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();
