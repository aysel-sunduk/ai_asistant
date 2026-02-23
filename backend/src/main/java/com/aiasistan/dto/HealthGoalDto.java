/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.aiasistan.model.HealthGoal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO: Sağlık hedefleri (health goals) bilgileri.
 */
public class HealthGoalDto {

    public static class Request {
        @NotNull(message = "waterMlTarget zorunludur")
        @Min(value = 1, message = "waterMlTarget pozitif olmali")
        private Integer waterMlTarget;

        @NotNull(message = "stepsTarget zorunludur")
        @Min(value = 1, message = "stepsTarget pozitif olmali")
        private Integer stepsTarget;

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
    }

    public static class Response {
        private UUID userId;
        private Integer waterMlTarget;
        private Integer stepsTarget;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public static Response from(HealthGoal goal) {
            Response response = new Response();
            response.userId = goal.getUserId();
            response.waterMlTarget = goal.getWaterMlTarget();
            response.stepsTarget = goal.getStepsTarget();
            response.createdAt = goal.getCreatedAt();
            response.updatedAt = goal.getUpdatedAt();
            return response;
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
}