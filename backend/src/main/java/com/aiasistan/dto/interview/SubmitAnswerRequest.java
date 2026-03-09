package com.aiasistan.dto.interview;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitAnswerRequest {
    private UUID questionId;

    @NotBlank(message = "Cevap boş olamaz")
    private String answerText;
}
