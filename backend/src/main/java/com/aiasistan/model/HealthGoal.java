/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.util.List;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;

@Entity
@Table(name = "health_goals")
public class HealthGoal {

    @Id
    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "water_ml_target", nullable = false)
    private Integer waterMlTarget = 2500;

    @Column(name = "steps_target", nullable = false)
    private Integer stepsTarget = 10000;

    @Column(name = "calorie_target")
    private Integer calorieTarget = 2000;

    @Column(name = "diet_goal")
    private String dietGoal = "MAINTAIN"; // LOSE_WEIGHT, MAINTAIN, GAIN_WEIGHT

    @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
    @CollectionTable(name = "health_goal_favorites", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "food_name")
    private List<String> favoriteFoods;

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Integer getWaterMlTarget() {
        return waterMlTarget;
    }

    public void setWaterMlTarget(Integer waterMlTarget) {
        this.waterMlTarget = waterMlTarget;
    }

    public Integer getStepsTarget() {
        return stepsTarget;
    }

    public void setStepsTarget(Integer stepsTarget) {
        this.stepsTarget = stepsTarget;
    }

    public Integer getCalorieTarget() {
        return calorieTarget;
    }

    public void setCalorieTarget(Integer calorieTarget) {
        this.calorieTarget = calorieTarget;
    }

    public String getDietGoal() {
        return dietGoal;
    }

    public void setDietGoal(String dietGoal) {
        this.dietGoal = dietGoal;
    }

    public List<String> getFavoriteFoods() {
        return favoriteFoods;
    }

    public void setFavoriteFoods(List<String> favoriteFoods) {
        this.favoriteFoods = favoriteFoods;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}