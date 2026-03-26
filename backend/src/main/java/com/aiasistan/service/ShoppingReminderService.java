package com.aiasistan.service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.aiasistan.model.ShoppingItem;
import com.aiasistan.repository.ShoppingItemRepository;

@Service
public class ShoppingReminderService {
    private static final Logger logger = LoggerFactory.getLogger(ShoppingReminderService.class);

    private final ShoppingItemRepository shoppingItemRepository;
    private final PushNotificationService pushNotificationService;

    public ShoppingReminderService(ShoppingItemRepository shoppingItemRepository,
                                  PushNotificationService pushNotificationService) {
        this.shoppingItemRepository = shoppingItemRepository;
        this.pushNotificationService = pushNotificationService;
    }

    public void processRemindersForUser(UUID userId, String productKey, String itemName) {
        List<ShoppingItem> items = shoppingItemRepository.findCheckedItemsByUserAndProductKey(userId, productKey);
        
        if (items.size() < 2) {
            // Planlandığı üzere, en az 2 alım gerekiyor ki aralık hesaplayabilelim.
            return;
        }

        double averageDays = calculateAverageDaysBetweenPurchases(items);
        if (averageDays <= 0) return;

        ShoppingItem lastItem = items.get(items.size() - 1);
        OffsetDateTime lastChecked = lastItem.getCheckedAt();
        
        if (lastChecked == null) return;

        long daysSinceLastPurchase = ChronoUnit.DAYS.between(lastChecked, OffsetDateTime.now());

        // Eğer ortalama süre dolmuşsa ve bugün henüz bildirim gönderilmemişse
        // (Not: Gerçek hayatta her gün aynı bildirimi göndermemek için bir 'lastRemindedAt' alanı gerekebilir 
        // ancak bu fazda basic yaklaşımı uyguluyoruz.)
        if (daysSinceLastPurchase >= Math.round(averageDays)) {
            logger.info("Sending shopping reminder to user {} for item {}", userId, itemName);
            pushNotificationService.sendShoppingReminder(userId, itemName);
        }
    }

    private double calculateAverageDaysBetweenPurchases(List<ShoppingItem> items) {
        long totalDays = 0;
        int intervals = items.size() - 1;

        for (int i = 0; i < intervals; i++) {
            OffsetDateTime current = items.get(i).getCheckedAt();
            OffsetDateTime next = items.get(i + 1).getCheckedAt();
            
            if (current != null && next != null) {
                totalDays += ChronoUnit.DAYS.between(current, next);
            }
        }

        return intervals > 0 ? (double) totalDays / intervals : 0;
    }
}
