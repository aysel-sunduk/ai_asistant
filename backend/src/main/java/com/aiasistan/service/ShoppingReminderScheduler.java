package com.aiasistan.service;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.aiasistan.repository.ShoppingItemRepository;

@Component
public class ShoppingReminderScheduler {
    private static final Logger logger = LoggerFactory.getLogger(ShoppingReminderScheduler.class);

    private final ShoppingItemRepository shoppingItemRepository;
    private final ShoppingReminderService shoppingReminderService;

    public ShoppingReminderScheduler(ShoppingItemRepository shoppingItemRepository, 
                                    ShoppingReminderService shoppingReminderService) {
        this.shoppingItemRepository = shoppingItemRepository;
        this.shoppingReminderService = shoppingReminderService;
    }

    /**
     * Her gün saat 10:00'da çalışır.
     * Alışveriş geçmişine göre bitmiş olabilecek ürünleri tahmin eder ve bildirim gönderir.
     */
    @Scheduled(cron = "${app.shopping.reminder.cron:0 0 10 * * *}")
    public void runShoppingReminders() {
        logger.info("Shopping reminder scheduler started.");
        
        List<Object[]> distinctItems = shoppingItemRepository.findDistinctCheckedItems();
        
        for (Object[] row : distinctItems) {
            try {
                UUID userId = (UUID) row[0];
                String productKey = (String) row[1];
                String itemName = (String) row[2];
                
                shoppingReminderService.processRemindersForUser(userId, productKey, itemName);
            } catch (Exception e) {
                logger.error("Error processing shopping reminder for row: {}", row, e);
            }
        }
        
        logger.info("Shopping reminder scheduler finished.");
    }
}
