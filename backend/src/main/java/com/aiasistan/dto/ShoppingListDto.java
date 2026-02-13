package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.aiasistan.model.ShoppingList;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ShoppingListDto {

    public static class Request {
        @NotBlank(message = "Liste adi bos olamaz")
        @Size(min = 2, max = 80, message = "Liste adi 2-80 karakter arasinda olmali")
        private String name;

        private Boolean isArchived;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Boolean getIsArchived() {
            return isArchived;
        }

        public void setIsArchived(Boolean isArchived) {
            this.isArchived = isArchived;
        }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private String name;
        private Boolean isArchived;
        private OffsetDateTime createdAt;

        public static Response from(ShoppingList list) {
            Response response = new Response();
            response.id = list.getId();
            response.userId = list.getUserId();
            response.name = list.getName();
            response.isArchived = list.getIsArchived();
            response.createdAt = list.getCreatedAt();
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

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Boolean getIsArchived() {
            return isArchived;
        }

        public void setIsArchived(Boolean isArchived) {
            this.isArchived = isArchived;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}
