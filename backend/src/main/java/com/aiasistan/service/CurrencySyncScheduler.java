/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(value = "finance.currency.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class CurrencySyncScheduler {

    private static final Logger logger = LoggerFactory.getLogger(CurrencySyncScheduler.class);
    private final CurrencyService currencyService;
    private final FinanceMarketService financeMarketService;

    public CurrencySyncScheduler(CurrencyService currencyService, FinanceMarketService financeMarketService) {
        this.currencyService = currencyService;
        this.financeMarketService = financeMarketService;
    }

    @Scheduled(cron = "${finance.currency.scheduler.sync-cron:0 0 9,12,15,18,21 * * *}")
    public void syncPopularFxRates() {
        if (currencyService.getRemainingDailyAlphaVantageQuota() <= 0) {
            logger.info(
                "Scheduled AlphaVantage sync skipped. Remaining daily quota: {}",
                currencyService.getRemainingDailyAlphaVantageQuota()
            );
            return;
        }
        try {
            financeMarketService.getPopularRates("TRY", true);
            logger.info(
                "Scheduled AlphaVantage popular currency sync completed. Remaining daily quota: {}",
                currencyService.getRemainingDailyAlphaVantageQuota()
            );
        } catch (Exception ex) {
            logger.warn("Scheduled AlphaVantage popular currency sync failed: {}", ex.getMessage());
        }
    }

    @Scheduled(cron = "${finance.currency.history.cleanup-cron:0 30 3 * * *}")
    public void cleanupHistoricalRates() {
        try {
            long deleted = currencyService.cleanupHistoricalRates();
            logger.info("Currency history cleanup completed. Deleted rows: {}", deleted);
        } catch (Exception ex) {
            logger.warn("Currency history cleanup failed: {}", ex.getMessage());
        }
    }
}