/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

import java.math.BigDecimal;

/**
 * DTO: Aile finans özeti (summary) yanıtı.
 */
public class FamilyFinanceSummaryResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;

    public BigDecimal getTotalIncome() { return totalIncome; }
    public void setTotalIncome(BigDecimal totalIncome) { this.totalIncome = totalIncome; }
    public BigDecimal getTotalExpense() { return totalExpense; }
    public void setTotalExpense(BigDecimal totalExpense) { this.totalExpense = totalExpense; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
}