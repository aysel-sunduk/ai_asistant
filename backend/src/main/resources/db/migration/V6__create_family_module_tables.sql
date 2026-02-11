-- Family module tables: income-expense and birthdays

CREATE TABLE IF NOT EXISTS family_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    type varchar(16) NOT NULL,
    amount_minor bigint NOT NULL,
    currency varchar(10) NOT NULL DEFAULT 'TRY',
    category varchar(60),
    occurred_on date NOT NULL,
    note text
);

CREATE INDEX IF NOT EXISTS idx_family_tx_user_date
    ON family_transactions (user_id, occurred_on DESC);

CREATE INDEX IF NOT EXISTS idx_family_tx_user_type
    ON family_transactions (user_id, type);

ALTER TABLE family_transactions
    ADD CONSTRAINT fk_family_tx_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS family_birthdays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    full_name varchar(120) NOT NULL,
    relationship varchar(60),
    birth_date date NOT NULL,
    phone varchar(30),
    email varchar(200),
    note text
);

CREATE INDEX IF NOT EXISTS idx_family_birthdays_user_date
    ON family_birthdays (user_id, birth_date);

ALTER TABLE family_birthdays
    ADD CONSTRAINT fk_family_birthdays_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
