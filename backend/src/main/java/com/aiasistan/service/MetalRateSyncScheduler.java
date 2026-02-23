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
@ConditionalOnProperty(value = "finance.currency.metals.collectapi.scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class MetalRateSyncScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MetalRateSyncScheduler.class);
    private final CurrencyService currencyService;

    public MetalRateSyncScheduler(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @Scheduled(cron = "${finance.currency.metals.collectapi.sync-cron:0 0 9,15,21 * * *}")
    public void syncCollectApiMetals() {
        try {
            if (currencyService.getRemainingDailyCollectApiQuota() <= 0) {
                logger.info("CollectAPI metal sync skipped. Daily quota exhausted.");
                return;
            }
            currencyService.syncMetalsFromCollectApi();
            logger.info(
                "CollectAPI metal sync completed. Remaining daily quota: {}",
                currencyService.getRemainingDailyCollectApiQuota()
            );
        } catch (Exception ex) {
            logger.warn("CollectAPI metal sync failed: {}", ex.getMessage());
        }
    }
}