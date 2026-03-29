package com.aiasistan.dto.interview;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;

public class SubmitAnswerRequest {
    private UUID questionId;

    @NotBlank(message = "Cevap boş olamaz")
    private String answerText;

    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }
}
