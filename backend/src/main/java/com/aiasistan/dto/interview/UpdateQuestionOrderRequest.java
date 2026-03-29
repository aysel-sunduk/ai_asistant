package com.aiasistan.dto.interview;

import java.util.List;
import java.util.UUID;
public class UpdateQuestionOrderRequest {
    private List<QuestionOrderDTO> orders;

    public List<QuestionOrderDTO> getOrders() {
        return orders;
    }

    public void setOrders(List<QuestionOrderDTO> orders) {
        this.orders = orders;
    }

    public static class QuestionOrderDTO {
        private UUID id;
        private Integer orderNo;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public Integer getOrderNo() {
            return orderNo;
        }

        public void setOrderNo(Integer orderNo) {
            this.orderNo = orderNo;
        }
    }
}
