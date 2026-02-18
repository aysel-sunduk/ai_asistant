CREATE TABLE IF NOT EXISTS "contacts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "name" text NOT NULL,
    "relationship" text,
    "birth_date" date,
    "phone" text,
    "email" text,
    "important_dates" jsonb,
    "notes" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_contacts_user" ON "contacts" ("user_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_contacts_user'
    ) THEN
        ALTER TABLE "contacts"
            ADD CONSTRAINT "fk_contacts_user"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE IF EXISTS "contacts"
    ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();

UPDATE "contacts"
SET "updated_at" = COALESCE("updated_at", "created_at", now())
WHERE "updated_at" IS NULL;
