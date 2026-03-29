-- Mülakat oturumlarına tarih alanı ekleme
-- V61__add_interview_date.sql

ALTER TABLE interview_sessions ADD COLUMN interview_date TIMESTAMP WITH TIME ZONE;
