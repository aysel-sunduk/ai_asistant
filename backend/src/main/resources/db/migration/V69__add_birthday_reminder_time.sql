-- V69: Add reminder_time column to family_birthdays table
ALTER TABLE family_birthdays ADD COLUMN reminder_time TIME DEFAULT '09:00:00';
