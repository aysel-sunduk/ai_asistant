package com.aiasistan.dto.interview;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
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

    @Data
    public static class QuestionResponseDTO {
        private UUID id;
        private String questionText;
        private String answerText;
        private String feedback;
        private Integer score;
        private Integer orderNo;
    }
}
