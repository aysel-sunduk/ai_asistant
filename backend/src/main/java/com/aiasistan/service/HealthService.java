package com.aiasistan.service;

import com.aiasistan.model.UserProfile;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;

@Service
public class HealthService {

    public double calculateBMI(Integer heightCm, BigDecimal weightKg) {
        if (heightCm == null || weightKg == null || heightCm <= 0)
            return 0;
        double heightM = heightCm / 100.0;
        return weightKg.doubleValue() / (heightM * heightM);
    }

    public int calculateBMR(UserProfile profile) {
        if (profile.getHeightCm() == null || profile.getWeightKg() == null || profile.getBirthDate() == null) {
            return 2000; // Varsayılan
        }

        int age = Period.between(profile.getBirthDate(), LocalDate.now()).getYears();
        double weight = profile.getWeightKg().doubleValue();
        double height = profile.getHeightCm().doubleValue();

        // Mifflin-St Jeor Formülü
        double bmr;
        if ("FEMALE".equalsIgnoreCase(profile.getGender())) {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        }
        return (int) bmr;
    }

    public int calculateDailyCalorieTarget(UserProfile profile, String dietGoal) {
        int bmr = calculateBMR(profile);
        double multiplier = getActivityMultiplier(profile.getActivityLevel());
        double tdee = bmr * multiplier;

        if ("LOSE_WEIGHT".equalsIgnoreCase(dietGoal)) {
            return (int) (tdee - 500);
        } else if ("GAIN_WEIGHT".equalsIgnoreCase(dietGoal)) {
            return (int) (tdee + 300);
        } else {
            return (int) tdee;
        }
    }

    private double getActivityMultiplier(String level) {
        if (level == null)
            return 1.2;
        return switch (level.toUpperCase()) {
            case "SEDENTARY" -> 1.2;
            case "LIGHTLY_ACTIVE", "LIGHT" -> 1.375;
            case "MODERATELY_ACTIVE", "MODERATE" -> 1.55;
            case "VERY_ACTIVE", "INTENSE" -> 1.725;
            case "EXTRA_ACTIVE" -> 1.9;
            default -> 1.2;
        };
    }
}
