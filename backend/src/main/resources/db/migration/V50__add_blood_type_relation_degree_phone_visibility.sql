-- V50: Kan grubu, yakınlık derecesi, telefon ve gizlilik ayarları
ALTER TABLE family_birthdays ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);
ALTER TABLE family_birthdays ADD COLUMN IF NOT EXISTS relation_degree VARCHAR(30);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relation_degree VARCHAR(30);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS show_phone BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT FALSE;
