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
        double heightM = heightCm.doubleValue() / 100.0;
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

        if (dietGoal == null) return (int) tdee;

        return switch (dietGoal.toUpperCase()) {
            case "LOSE_WEIGHT" -> (int) (tdee - 500);
            case "GAIN_WEIGHT", "MUSCLE_GAIN" -> (int) (tdee + 300);
            case "ATHLETIC_PERFORMANCE" -> (int) (tdee + 150);
            case "HEALTHY_LIVING", "MAINTAIN" -> (int) tdee;
            default -> (int) tdee;
        };
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

    public double calculateBodyFatPercentage(UserProfile profile) {
        if (profile.getHeightCm() == null || profile.getWeightKg() == null ||
                profile.getBirthDate() == null || profile.getGender() == null) {
            return 0.0;
        }

        double bmi = calculateBMI(profile.getHeightCm(), profile.getWeightKg());
        if (bmi <= 0)
            return 0.0;

        int age = Period.between(profile.getBirthDate(), LocalDate.now()).getYears();
        int genderFactor = "MALE".equalsIgnoreCase(profile.getGender()) ? 1 : 0;

        // Dewuren formülü (BMI tabanlı)
        // Yağ Oranı = (1.20 × BMI) + (0.23 × Yaş) - (10.8 × Cinsiyet Değeri) - 5.4
        double bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;

        // Vücut tipine göre kalibrasyon
        String bodyType = profile.getBodyType();
        if (bodyType != null) {
            switch (bodyType.toUpperCase()) {
                case "ECTOMORPH": // İnce, zor kilo alan
                    bodyFat *= 0.85;
                    break;
                case "MESOMORPH": // Atletik, kaslı
                    bodyFat *= 0.95; // Biraz daha düşük yağ oranı
                    break;
                case "ENDOMORPH": // İri kemikli, kolay kilo alan
                    bodyFat *= 1.15;
                    break;
            }
        }

        return Math.max(2.0, Math.min(bodyFat, 60.0)); // Makul sınırlar içine al (en az %2, en fazla %60)
    }
}
