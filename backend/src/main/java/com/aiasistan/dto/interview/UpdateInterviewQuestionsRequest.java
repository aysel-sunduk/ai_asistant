package com.aiasistan.dto.interview;

import java.util.List;
import java.util.UUID;
public class UpdateInterviewQuestionsRequest {
    private List<QuestionUpdateDTO> questions;

    public List<QuestionUpdateDTO> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionUpdateDTO> questions) {
        this.questions = questions;
    }

    public static class QuestionUpdateDTO {
        private UUID id;
        private String questionText;
        private Integer orderNo;

        private String difficulty;

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

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

        public Integer getOrderNo() {
            return orderNo;
        }

        public void setOrderNo(Integer orderNo) {
            this.orderNo = orderNo;
        }
    }
}
