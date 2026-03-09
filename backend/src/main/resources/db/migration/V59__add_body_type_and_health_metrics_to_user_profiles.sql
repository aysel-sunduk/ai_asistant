-- Migration to add body_type, bmi, bmr, and body_fat_percentage columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN body_type VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN bmi DOUBLE PRECISION;
ALTER TABLE user_profiles ADD COLUMN bmr INTEGER;
ALTER TABLE user_profiles ADD COLUMN body_fat_percentage DOUBLE PRECISION;
