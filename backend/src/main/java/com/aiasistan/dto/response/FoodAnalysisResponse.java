package com.aiasistan.dto.response;

public class FoodAnalysisResponse {
    private String foodName;
    private Double confidence;
    private Double calories;
    private Double protein;
    private Double fat;
    private Double carbs;

    public FoodAnalysisResponse() {
    }

    public FoodAnalysisResponse(String foodName, Double confidence, Double calories, Double protein, Double fat,
            Double carbs) {
        this.foodName = foodName;
        this.confidence = confidence;
        this.calories = calories;
        this.protein = protein;
        this.fat = fat;
        this.carbs = carbs;
    }

    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Double getCalories() {
        return calories;
    }

    public void setCalories(Double calories) {
        this.calories = calories;
    }

    public Double getProtein() {
        return protein;
    }

    public void setProtein(Double protein) {
        this.protein = protein;
    }

    public Double getFat() {
        return fat;
    }

    public void setFat(Double fat) {
        this.fat = fat;
    }

    public Double getCarbs() {
        return carbs;
    }

    public void setCarbs(Double carbs) {
        this.carbs = carbs;
    }
}
