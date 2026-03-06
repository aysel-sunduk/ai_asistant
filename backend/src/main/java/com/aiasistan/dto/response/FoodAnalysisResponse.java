package com.aiasistan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodAnalysisResponse {
    private String foodName;
    private Double confidence;
    private Double calories;
    private Double protein;
    private Double fat;
    private Double carbs;
}
