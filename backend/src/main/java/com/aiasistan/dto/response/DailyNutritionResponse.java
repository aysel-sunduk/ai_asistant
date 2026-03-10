package com.aiasistan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyNutritionResponse {
    private double totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFat;
    private int mealCount;
}
