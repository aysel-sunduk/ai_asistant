/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import com.aiasistan.common.UserOwnedEntity;
import org.hibernate.annotations.Where;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "finance_user_favorite_currencies")
@Where(clause = "deleted_at IS NULL")
public class UserFavoriteCurrency extends UserOwnedEntity {

    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
