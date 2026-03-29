package com.aiasistan.dto.interview;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
public class InterviewSessionResponse {
    private UUID id;
    private UUID userId;
    private String title;
    private String position;
    private String jobDescription;
    private String status;
    private String overallFeedback;
    private Integer overallScore;
    private Instant createdAt;
    private Instant interviewDate;
    private List<QuestionResponseDTO> questions;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOverallFeedback() {
        return overallFeedback;
    }

    public void setOverallFeedback(String overallFeedback) {
        this.overallFeedback = overallFeedback;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(Instant interviewDate) {
        this.interviewDate = interviewDate;
    }

    public List<QuestionResponseDTO> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionResponseDTO> questions) {
        this.questions = questions;
    }

    public static class QuestionResponseDTO {
        private UUID id;
        private String questionText;
        private String answerText;
        private String feedback;
        private Integer score;
        private String difficulty;
        private Integer orderNo;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public String getAnswerText() {
            return answerText;
        }

        public void setAnswerText(String answerText) {
            this.answerText = answerText;
        }

        public String getFeedback() {
            return feedback;
        }

        public void setFeedback(String feedback) {
            this.feedback = feedback;
        }

        public Integer getScore() {
            return score;
        }

        public void setScore(Integer score) {
            this.score = score;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public Integer getOrderNo() {
            return orderNo;
        }

        public void setOrderNo(Integer orderNo) {
            this.orderNo = orderNo;
        }
    }
}
