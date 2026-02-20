package com.aiasistan.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.HealthGoalDto;
import com.aiasistan.model.HealthGoal;
import com.aiasistan.repository.HealthGoalRepository;

@Service
public class HealthGoalService {

    private static final int DEFAULT_WATER_ML_TARGET = 2500;
    private static final int DEFAULT_STEPS_TARGET = 10000;

    private final HealthGoalRepository healthGoalRepository;
    private final UserService userService;

    public HealthGoalService(HealthGoalRepository healthGoalRepository, UserService userService) {
        this.healthGoalRepository = healthGoalRepository;
        this.userService = userService;
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
