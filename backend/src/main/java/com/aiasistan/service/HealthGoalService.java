/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.HealthGoalDto;
import com.aiasistan.model.HealthGoal;
import com.aiasistan.model.UserProfile;
import com.aiasistan.repository.HealthGoalRepository;
import com.aiasistan.repository.UserProfileRepository;
import com.aiasistan.exception.NotFoundException;

@Service
public class HealthGoalService {

    private static final int DEFAULT_WATER_ML_TARGET = 2500;
    private static final int DEFAULT_STEPS_TARGET = 10000;

    private final HealthGoalRepository healthGoalRepository;
    private final UserService userService;
    private final HealthService healthService;
    private final UserProfileRepository userProfileRepository;

    public HealthGoalService(HealthGoalRepository healthGoalRepository, UserService userService,
            HealthService healthService, UserProfileRepository userProfileRepository) {
        this.healthGoalRepository = healthGoalRepository;
        this.userService = userService;
        this.healthService = healthService;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public HealthGoalDto.Response getOrCreateGoals(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        HealthGoal goals = healthGoalRepository.findById(userId).orElseGet(() -> createDefaultGoals(userId));
        return HealthGoalDto.Response.from(goals);
    }

    @Transactional
    public HealthGoalDto.Response upsertGoals(String userEmail, HealthGoalDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        HealthGoal goals = healthGoalRepository.findById(userId).orElseGet(() -> createDefaultGoals(userId));
        goals.setWaterMlTarget(request.getWaterMlTarget());
        goals.setStepsTarget(request.getStepsTarget());

        if (request.getDietGoal() != null) {
            goals.setDietGoal(request.getDietGoal());
        }

        // Eğer kalori hedefi gönderilmemişse, profil verilerinden hesapla
        if (request.getCalorieTarget() == null || request.getCalorieTarget() <= 0) {
            UserProfile profile = userProfileRepository.findById(userId).orElse(null);
            if (profile != null) {
                int calculated = healthService.calculateDailyCalorieTarget(profile, goals.getDietGoal());
                goals.setCalorieTarget(calculated);
            }
        } else {
            goals.setCalorieTarget(request.getCalorieTarget());
        }

        return HealthGoalDto.Response.from(healthGoalRepository.save(goals));
    }

    private HealthGoal createDefaultGoals(UUID userId) {
        HealthGoal goals = new HealthGoal();
        goals.setUserId(userId);
        goals.setWaterMlTarget(DEFAULT_WATER_ML_TARGET);
        goals.setStepsTarget(DEFAULT_STEPS_TARGET);
        return healthGoalRepository.save(goals);
    }
}