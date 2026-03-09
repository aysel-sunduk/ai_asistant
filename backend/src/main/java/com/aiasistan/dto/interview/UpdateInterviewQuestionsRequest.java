package com.aiasistan.dto.interview;

import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class UpdateInterviewQuestionsRequest {
    private List<QuestionUpdateDTO> questions;

    @Data
    public static class QuestionUpdateDTO {
        private UUID id;
        private String questionText;
        private Integer orderNo;
    }
}
