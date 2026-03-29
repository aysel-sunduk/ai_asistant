-- Add missing difficulty column to interview_questions table
ALTER TABLE interview_questions 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
