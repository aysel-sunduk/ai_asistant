-- Mülakat Provası Sistemi için tablolar
-- V60__create_interview_system.sql

CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    job_description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SETUP', -- SETUP, IN_PROGRESS, COMPLETED
    overall_feedback TEXT,
    overall_score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interview_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE interview_questions (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    feedback TEXT,
    score INT,
    order_no INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interview_question_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_interview_session_user ON interview_sessions(user_id);
CREATE INDEX idx_interview_question_session ON interview_questions(session_id);
