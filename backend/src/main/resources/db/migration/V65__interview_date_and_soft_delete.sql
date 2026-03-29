-- V63: interview_date sütunu ve is_deleted sütunu ekleme

ALTER TABLE interview_sessions
    ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE interview_questions
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
