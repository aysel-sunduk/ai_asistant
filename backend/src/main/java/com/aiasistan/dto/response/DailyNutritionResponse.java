package com.aiasistan.dto.response;

public class DailyNutritionResponse {
    private double totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFat;
    private int mealCount;

    public DailyNutritionResponse() {
        this.totalCalories = 0.0;
        this.totalProtein = 0.0;
        this.totalCarbs = 0.0;
        this.totalFat = 0.0;
        this.mealCount = 0;
    }

    public DailyNutritionResponse(double totalCalories, double totalProtein, double totalCarbs, double totalFat, int mealCount) {
        this.totalCalories = totalCalories;
        this.totalProtein = totalProtein;
        this.totalCarbs = totalCarbs;
        this.totalFat = totalFat;
        this.mealCount = mealCount;
    }

    public double getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(double totalCalories) {
        this.totalCalories = totalCalories;
    }

    public double getTotalProtein() {
        return totalProtein;
    }

    public void setTotalProtein(double totalProtein) {
        this.totalProtein = totalProtein;
    }

    public double getTotalCarbs() {
        return totalCarbs;
    }

    public void setTotalCarbs(double totalCarbs) {
        this.totalCarbs = totalCarbs;
    }

    public double getTotalFat() {
        return totalFat;
    }

    public void setTotalFat(double totalFat) {
        this.totalFat = totalFat;
    }

    public int getMealCount() {
        return mealCount;
    }

    public void setMealCount(int mealCount) {
        this.mealCount = mealCount;
    }
}
