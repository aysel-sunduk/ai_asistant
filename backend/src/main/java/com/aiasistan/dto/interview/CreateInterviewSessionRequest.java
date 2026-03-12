package com.aiasistan.dto.interview;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateInterviewSessionRequest {
    @NotBlank(message = "Mülakat başlığı boş olamaz")
    private String title;

    @NotBlank(message = "Pozisyon bilgisi boş olamaz")
    private String position;

    private String jobDescription;

    private String interviewDate;
}
