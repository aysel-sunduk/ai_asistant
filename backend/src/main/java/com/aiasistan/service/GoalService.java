/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.List;
import java.util.Locale;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.GoalDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.Goal;
import com.aiasistan.repository.GoalRepository;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserService userService;
    private final OpenRouterAiService openRouterAiService;

    public GoalService(GoalRepository goalRepository, UserService userService,
            OpenRouterAiService openRouterAiService) {
        this.goalRepository = goalRepository;
        this.userService = userService;
        this.openRouterAiService = openRouterAiService;
    }

    @Transactional
    public GoalDto.Response createGoal(String userEmail, GoalDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        Goal goal = new Goal();
        goal.setUserId(userId);
        applyRequest(goal, request);

        Goal saved = goalRepository.save(goal);
        return GoalDto.Response.from(saved);
    }

    @Transactional(readOnly = true)
    public GoalDto.Response getGoalById(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Goal goal = findOwnedGoal(id, userId);
        return GoalDto.Response.from(goal);
    }

    @Transactional(readOnly = true)
    public PageResponse<GoalDto.Response> getGoals(String userEmail, Boolean completed, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<Goal> page = completed == null
                ? goalRepository.findByUserId(userId, pageable)
                : goalRepository.findByUserIdAndIsCompleted(userId, completed, pageable);

        return PageResponse.of(page.map(GoalDto.Response::from));
    }

    @Transactional
    public GoalDto.Response updateGoal(String userEmail, UUID id, GoalDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Goal goal = findOwnedGoal(id, userId);

        applyRequest(goal, request);

        Goal saved = goalRepository.save(goal);
        return GoalDto.Response.from(saved);
    }

    @Transactional
    public GoalDto.Response updateProgress(String userEmail, UUID id, Integer progressPct) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Goal goal = findOwnedGoal(id, userId);

        Integer previousProgress = goal.getProgressPct();
        int normalized = normalizeProgress(progressPct);
        if (normalized >= 100 && (previousProgress == null || previousProgress < 100)) {
            goal.setProgressPctBeforeCompletion(normalizeProgress(previousProgress));
        } else if (normalized < 100) {
            goal.setProgressPctBeforeCompletion(null);
        }
        goal.setProgressPct(normalized);
        goal.setIsCompleted(normalized >= 100);

        Goal saved = goalRepository.save(goal);
        return GoalDto.Response.from(saved);
    }

    @Transactional
    public GoalDto.Response updateCompletion(String userEmail, UUID id, Boolean isCompleted) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Goal goal = findOwnedGoal(id, userId);

        boolean completed = Boolean.TRUE.equals(isCompleted);
        goal.setIsCompleted(completed);
        if (completed) {
            int currentProgress = normalizeProgress(goal.getProgressPct());
            if (currentProgress < 100) {
                goal.setProgressPctBeforeCompletion(currentProgress);
            }
            goal.setProgressPct(100);
        } else {
            Integer progressBeforeCompletion = goal.getProgressPctBeforeCompletion();
            if (progressBeforeCompletion != null) {
                goal.setProgressPct(normalizeProgress(progressBeforeCompletion));
            }
            goal.setProgressPctBeforeCompletion(null);
        }

        Goal saved = goalRepository.save(goal);
        return GoalDto.Response.from(saved);
    }

    @Transactional
    public void deleteGoal(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Goal goal = findOwnedGoal(id, userId);
        goal.setDeletedAt(OffsetDateTime.now());
        goalRepository.save(goal);
    }

    /**
     * Hedef için AI motivasyon mesajı üretir.
     */
    @Transactional(readOnly = true)
    public GoalDto.MotivationResponse getGoalMotivation(String userEmail, UUID goalId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Goal goal = findOwnedGoal(goalId, userId);

        String message = openRouterAiService.generateGoalMotivation(
                goal.getTitle(),
                goal.getDescription(),
                goal.getCategory(),
                goal.getProgressPct());

        GoalDto.MotivationResponse response = new GoalDto.MotivationResponse();
        response.setMessage(message);
        response.setGoalTitle(goal.getTitle());
        response.setProgressPct(goal.getProgressPct());
        return response;
    }

    private void applyRequest(Goal goal, GoalDto.Request request) {
        String normalizedTitle = request.getTitle().trim();
        if (normalizedTitle.length() < 3 || normalizedTitle.length() > 120) {
            throw new BadRequestException("Hedef basligi 3-120 karakter arasinda olmali");
        }
        goal.setTitle(normalizedTitle);
        goal.setDescription(request.getDescription());
        goal.setCategory(normalizeCategory(request.getCategory()));
        goal.setTargetDate(request.getTargetDate());

        int progress = normalizeProgress(
                request.getProgressPct() != null ? request.getProgressPct() : goal.getProgressPct());
        boolean completed = request.getIsCompleted() != null ? request.getIsCompleted() : progress >= 100;

        if (completed && progress < 100) {
            goal.setProgressPctBeforeCompletion(progress);
            progress = 100;
        } else if (!completed && progress < 100) {
            goal.setProgressPctBeforeCompletion(null);
        }

        goal.setProgressPct(progress);
        goal.setIsCompleted(completed);

        List<java.util.Map<String, Object>> milestones = request.getMilestones();
        if (milestones != null) {
            goal.setMilestones(milestones);
        }
    }

    private int normalizeProgress(Integer progressPct) {
        if (progressPct == null) {
            return 0;
        }
        if (progressPct < 0) {
            return 0;
        }
        if (progressPct > 100) {
            return 100;
        }
        return progressPct;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        return category.trim().toLowerCase(Locale.ROOT);
    }

    private Goal findOwnedGoal(UUID id, UUID userId) {
        return goalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Hedef bulunamadi"));
    }
}
