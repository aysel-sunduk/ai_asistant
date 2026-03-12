package com.aiasistan.dto.interview;

import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class UpdateQuestionOrderRequest {
    private List<QuestionOrderDTO> orders;

    @Data
    public static class QuestionOrderDTO {
        private UUID id;
        private Integer orderNo;
    }
}
