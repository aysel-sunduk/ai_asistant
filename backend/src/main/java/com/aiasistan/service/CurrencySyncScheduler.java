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

    public CurrencySyncScheduler(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @Scheduled(
        fixedDelayString = "${finance.currency.update-interval:3600000}",
        initialDelayString = "${finance.currency.scheduler.initial-delay:60000}"
    )
    public void syncLiveRates() {
        try {
            currencyService.fetchAndSaveLiveRates("USD");
            logger.info("Scheduled currency sync completed.");
        } catch (Exception ex) {
            logger.warn("Scheduled currency sync failed: {}", ex.getMessage());
        }
    }
}
