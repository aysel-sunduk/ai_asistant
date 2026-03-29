package com.aiasistan.controller;

import java.util.Map;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.model.HealthGoal;
import com.aiasistan.model.UserProfile;
import com.aiasistan.repository.HealthGoalRepository;
import com.aiasistan.service.HealthService;
import com.aiasistan.service.UserProfileService;
import com.aiasistan.service.UserService;

import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/v1/health/diet")
public class DietRecommendationController {
    private static final Logger log = LoggerFactory.getLogger(DietRecommendationController.class);

    @Value("${app.ai.ml-service-url:http://localhost:8000}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final UserService userService;
    private final UserProfileService userProfileService;
    private final HealthGoalRepository healthGoalRepository;
    private final HealthService healthService;

    public DietRecommendationController(
            UserService userService,
            UserProfileService userProfileService,
            HealthGoalRepository healthGoalRepository,
            HealthService healthService) {
        this.userService = userService;
        this.userProfileService = userProfileService;
        this.healthGoalRepository = healthGoalRepository;
        this.healthService = healthService;
    }

    @PostMapping("/recommend")
    @Operation(summary = "Kişiselleştirilmiş günlük diyet planı oluştur")
    public ResponseEntity<ApiResponse<Object>> recommendDietPlan(
            Authentication authentication,
            @RequestBody DietRecommendRequest request) {
        log.info("Diet recommendation request from user: {}", authentication.getName());

        try {
            var userId = userService.getUserIdByEmail(authentication.getName());
            UserProfile profile = userProfileService.getOrCreateProfile(userId);
            HealthGoal healthGoal = healthGoalRepository.findById(userId).orElse(null);

            // Diyet hedefini belirle
            String dietGoal = request.dietGoal != null ? request.dietGoal : "MAINTAIN";

            // Kalori hedefini hesapla
            int calorieTarget;
            if (request.calorieTarget != null && request.calorieTarget > 0) {
                calorieTarget = request.calorieTarget;
            } else {
                if (healthGoal != null && healthGoal.getCalorieTarget() != null && healthGoal.getCalorieTarget() > 0) {
                    calorieTarget = healthGoal.getCalorieTarget();
                    if (healthGoal.getDietGoal() != null && request.dietGoal == null) {
                        dietGoal = healthGoal.getDietGoal();
                    }
                } else {
                    calorieTarget = healthService.calculateDailyCalorieTarget(profile, dietGoal);
                }
            }

            // ML servise gönder
            String url = mlServiceUrl + "/api/diet/recommend";
            
            List<String> favFoods = request.favoriteFoods;
            if (favFoods == null && healthGoal != null) {
                favFoods = healthGoal.getFavoriteFoods();
            }

            Map<String, Object> mlRequest = Map.of(
                    "calorie_target", calorieTarget,
                    "diet_goal", dietGoal,
                    "allergies", request.allergies != null ? request.allergies : List.of(),
                    "preference", request.preference != null ? request.preference : "NORMAL",
                    "excluded_foods", request.excludedFoods != null ? request.excludedFoods : List.of(),
                    "favorite_foods", favFoods != null ? favFoods : List.of());

            ResponseEntity<Object> response = restTemplate.postForEntity(url, mlRequest, Object.class);

            // Favori yiyecekleri yanıta ekle
            Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
            if (responseBody != null) {
                responseBody.put("favorite_foods", favFoods != null ? favFoods : List.of());
            }

            return ResponseEntity.ok(ApiResponse.ok(responseBody, "Diyet planı oluşturuldu"));

        } catch (Exception e) {
            log.error("Diet recommendation failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Diyet önerisi oluşturulamadı: " + e.getMessage()));
        }
    }

    @PostMapping("/meal-swap")
    @Operation(summary = "Alternatif yemek önerisi al")
    public ResponseEntity<ApiResponse<Object>> swapMeal(
            Authentication authentication,
            @RequestBody MealSwapRequest request) {
        log.info("Meal swap request from user: {}", authentication.getName());

        try {
            var userId = userService.getUserIdByEmail(authentication.getName());
            UserProfile profile = userProfileService.getOrCreateProfile(userId);
            HealthGoal healthGoal = healthGoalRepository.findById(userId).orElse(null);

            // Diyet hedefini belirle
            String dietGoal = request.dietGoal != null ? request.dietGoal : "MAINTAIN";

            // Kalori hedefini hesapla
            int calorieTarget;
            if (request.calorieTarget != null && request.calorieTarget > 0) {
                calorieTarget = request.calorieTarget;
            } else {
                if (healthGoal != null && healthGoal.getCalorieTarget() != null && healthGoal.getCalorieTarget() > 0) {
                    calorieTarget = healthGoal.getCalorieTarget();
                    if (healthGoal.getDietGoal() != null && request.dietGoal == null) {
                        dietGoal = healthGoal.getDietGoal();
                    }
                } else {
                    calorieTarget = healthService.calculateDailyCalorieTarget(profile, dietGoal);
                }
            }

            String url = mlServiceUrl + "/api/diet/meal-swap";
            Map<String, Object> mlRequest = Map.of(
                    "slot", request.slot,
                    "calorie_target", calorieTarget,
                    "diet_goal", dietGoal,
                    "excluded_recipe_ids",
                    request.excludedRecipeIds != null ? request.excludedRecipeIds : List.of(),
                    "preference", request.preference != null ? request.preference : "NORMAL");

            ResponseEntity<Object> response = restTemplate.postForEntity(url, mlRequest, Object.class);

            // Favorileri yanıta ekle (meal swap için de faydalı olabilir)
            Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
            if (responseBody != null && healthGoal != null) {
                responseBody.put("favorite_foods", healthGoal.getFavoriteFoods());
            }

            return ResponseEntity.ok(ApiResponse.ok(responseBody, "Alternatif yemek önerildi"));

        } catch (Exception e) {
            log.error("Meal swap failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Yemek değiştirme başarısız: " + e.getMessage()));
        }
    }

    @PostMapping("/favorite")
    @Operation(summary = "Yemeği favorilere ekle veya çıkar")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<List<String>>> toggleFavoriteMeal(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        String foodName = request.get("foodName");
        if (foodName == null || foodName.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Yemek ismi boş olamaz"));
        }

        try {
            var userId = userService.getUserIdByEmail(authentication.getName());
            HealthGoal healthGoal = healthGoalRepository.findById(userId)
                    .orElseGet(() -> {
                        HealthGoal newGoal = new HealthGoal();
                        newGoal.setUserId(userId);
                        return newGoal;
                    });

            List<String> favs = healthGoal.getFavoriteFoods();
            if (favs == null) {
                favs = new java.util.ArrayList<>();
            } else {
                favs = new java.util.ArrayList<>(favs); // mutable copy
            }

            if (favs.contains(foodName)) {
                favs.remove(foodName);
            } else {
                favs.add(foodName);
            }

            healthGoal.setFavoriteFoods(favs);
            healthGoalRepository.save(healthGoal);

            return ResponseEntity.ok(ApiResponse.ok(favs, "Favoriler güncellendi"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Favori işlemi başarısız: " + e.getMessage()));
        }
    }

    // --- Inner DTO classes ---

    public static class DietRecommendRequest {
        public Integer calorieTarget;
        public String dietGoal;
        public List<String> allergies;
        public String preference;
        public List<String> excludedFoods;
        public List<String> favoriteFoods;
    }

    public static class MealSwapRequest {
        public String slot;
        public Integer calorieTarget;
        public String dietGoal;
        public List<Integer> excludedRecipeIds;
        public String preference;
    }
}
