-- Profil fotoğrafı desteği için UserProfile tablosuna yeni kolon eklenmesi
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
