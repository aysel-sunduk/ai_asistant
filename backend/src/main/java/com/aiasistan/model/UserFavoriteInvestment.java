/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import java.util.UUID;

import com.aiasistan.common.UserOwnedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "finance_user_favorite_investments")
public class UserFavoriteInvestment extends UserOwnedEntity {

    @Column(name = "investment_id", nullable = false, columnDefinition = "uuid")
    private UUID investmentId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    public UUID getInvestmentId() {
        return investmentId;
    }

    public void setInvestmentId(UUID investmentId) {
        this.investmentId = investmentId;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}