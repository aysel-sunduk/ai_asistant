/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO: Aile finans raporu yanıtı.
 */
public class FamilyFinanceReportResponse {
    private String period;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private BigDecimal previousIncome;
    private BigDecimal previousExpense;
    private BigDecimal previousBalance;
    private BigDecimal incomeChangePct;
    private BigDecimal expenseChangePct;
    private BigDecimal balanceChangePct;
    private List<Bucket> buckets = new ArrayList<>();

    public static class Bucket {
        private String label;
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal balance;

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public BigDecimal getIncome() { return income; }
        public void setIncome(BigDecimal income) { this.income = income; }
        public BigDecimal getExpense() { return expense; }
        public void setExpense(BigDecimal expense) { this.expense = expense; }
        public BigDecimal getBalance() { return balance; }
        public void setBalance(BigDecimal balance) { this.balance = balance; }
    }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getTotalIncome() { return totalIncome; }
    public void setTotalIncome(BigDecimal totalIncome) { this.totalIncome = totalIncome; }
    public BigDecimal getTotalExpense() { return totalExpense; }
    public void setTotalExpense(BigDecimal totalExpense) { this.totalExpense = totalExpense; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public BigDecimal getPreviousIncome() { return previousIncome; }
    public void setPreviousIncome(BigDecimal previousIncome) { this.previousIncome = previousIncome; }
    public BigDecimal getPreviousExpense() { return previousExpense; }
    public void setPreviousExpense(BigDecimal previousExpense) { this.previousExpense = previousExpense; }
    public BigDecimal getPreviousBalance() { return previousBalance; }
    public void setPreviousBalance(BigDecimal previousBalance) { this.previousBalance = previousBalance; }
    public BigDecimal getIncomeChangePct() { return incomeChangePct; }
    public void setIncomeChangePct(BigDecimal incomeChangePct) { this.incomeChangePct = incomeChangePct; }
    public BigDecimal getExpenseChangePct() { return expenseChangePct; }
    public void setExpenseChangePct(BigDecimal expenseChangePct) { this.expenseChangePct = expenseChangePct; }
    public BigDecimal getBalanceChangePct() { return balanceChangePct; }
    public void setBalanceChangePct(BigDecimal balanceChangePct) { this.balanceChangePct = balanceChangePct; }
    public List<Bucket> getBuckets() { return buckets; }
    public void setBuckets(List<Bucket> buckets) { this.buckets = buckets; }
}