/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.aiasistan.model.Goal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO: Genel hedef (goal) verileri.
 */
public class GoalDto {

    public static class Request {
        @NotBlank(message = "Hedef basligi bos olamaz")
        @Size(min = 3, max = 120, message = "Hedef basligi 3-120 karakter arasinda olmali")
        private String title;

        private String description;
        private String category;
        private LocalDate targetDate;

        @Min(value = 0, message = "Ilerleme 0-100 arasinda olmali")
        @Max(value = 100, message = "Ilerleme 0-100 arasinda olmali")
        private Integer progressPct;

        private Boolean isCompleted;
        private List<Map<String, Object>> milestones;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public LocalDate getTargetDate() {
            return targetDate;
        }

        public void setTargetDate(LocalDate targetDate) {
            this.targetDate = targetDate;
        }

        public Integer getProgressPct() {
            return progressPct;
        }

        public void setProgressPct(Integer progressPct) {
            this.progressPct = progressPct;
        }

        public Boolean getIsCompleted() {
            return isCompleted;
        }

        public void setIsCompleted(Boolean isCompleted) {
            this.isCompleted = isCompleted;
        }

        public List<Map<String, Object>> getMilestones() {
            return milestones;
        }

        public void setMilestones(List<Map<String, Object>> milestones) {
            this.milestones = milestones;
        }
    }

    public static class ProgressRequest {
        @NotNull(message = "Ilerleme degeri zorunludur")
        @Min(value = 0, message = "Ilerleme 0-100 arasinda olmali")
        @Max(value = 100, message = "Ilerleme 0-100 arasinda olmali")
        private Integer progressPct;

        public Integer getProgressPct() {
            return progressPct;
        }

        public void setProgressPct(Integer progressPct) {
            this.progressPct = progressPct;
        }
    }

    public static class CompletionRequest {
        @NotNull(message = "Tamamlanma durumu zorunludur")
        private Boolean isCompleted;

        public Boolean getIsCompleted() {
            return isCompleted;
        }

        public void setIsCompleted(Boolean isCompleted) {
            this.isCompleted = isCompleted;
        }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private String title;
        private String description;
        private String category;
        private LocalDate targetDate;
        private Integer progressPct;
        private Boolean isCompleted;
        private List<Map<String, Object>> milestones;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public static Response from(Goal goal) {
            Response response = new Response();
            response.id = goal.getId();
            response.userId = goal.getUserId();
            response.title = goal.getTitle();
            response.description = goal.getDescription();
            response.category = goal.getCategory();
            response.targetDate = goal.getTargetDate();
            response.progressPct = goal.getProgressPct();
            response.isCompleted = goal.getIsCompleted();
            response.milestones = goal.getMilestones();
            response.createdAt = goal.getCreatedAt();
            response.updatedAt = goal.getUpdatedAt();
            return response;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public LocalDate getTargetDate() {
            return targetDate;
        }

        public void setTargetDate(LocalDate targetDate) {
            this.targetDate = targetDate;
        }

        public Integer getProgressPct() {
            return progressPct;
        }

        public void setProgressPct(Integer progressPct) {
            this.progressPct = progressPct;
        }

        public Boolean getIsCompleted() {
            return isCompleted;
        }

        public void setIsCompleted(Boolean isCompleted) {
            this.isCompleted = isCompleted;
        }

        public List<Map<String, Object>> getMilestones() {
            return milestones;
        }

        public void setMilestones(List<Map<String, Object>> milestones) {
            this.milestones = milestones;
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

    /**
     * AI motivasyon mesajı yanıtı.
     */
    public static class MotivationResponse {
        private String message;
        private String goalTitle;
        private Integer progressPct;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getGoalTitle() {
            return goalTitle;
        }

        public void setGoalTitle(String goalTitle) {
            this.goalTitle = goalTitle;
        }

        public Integer getProgressPct() {
            return progressPct;
        }

        public void setProgressPct(Integer progressPct) {
            this.progressPct = progressPct;
        }
    }
}