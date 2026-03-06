-- Migration to add activity_level column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN activity_level VARCHAR(50);
