/**
 * Kisa aciklama: Alisveris onerisi icin DTO.
 */

package com.aiasistan.dto;

import java.util.ArrayList;
import java.util.List;

public class ShoppingRecommendationDto {

    public static class Response {
        private String productKey;
        private String itemName;
        private String category;
        private Double score;
        private List<String> reasons = new ArrayList<>();

        public String getProductKey() {
            return productKey;
        }

        public void setProductKey(String productKey) {
            this.productKey = productKey;
        }

        public String getItemName() {
            return itemName;
        }

        public void setItemName(String itemName) {
            this.itemName = itemName;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public Double getScore() {
            return score;
        }

        public void setScore(Double score) {
            this.score = score;
        }

        public List<String> getReasons() {
            return reasons;
        }

        public void setReasons(List<String> reasons) {
            this.reasons = reasons == null ? new ArrayList<>() : reasons;
        }
    }
}
