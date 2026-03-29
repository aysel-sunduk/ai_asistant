package com.aiasistan.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.aiasistan.model.UserProfile;
import com.aiasistan.repository.UserProfileRepository;

@Component
public class BirthdayNotificationScheduler {
    private static final Logger logger = LoggerFactory.getLogger(BirthdayNotificationScheduler.class);

    private final UserProfileRepository userProfileRepository;
    private final PushNotificationService pushNotificationService;

    public BirthdayNotificationScheduler(UserProfileRepository userProfileRepository, 
                                        PushNotificationService pushNotificationService) {
        this.userProfileRepository = userProfileRepository;
        this.pushNotificationService = pushNotificationService;
    }

    /**
     * Her gün saat 09:00'da çalışır.
     * Bugün doğum günü olan kullanıcıları bulur ve bildirim gönderir.
     */
    @Scheduled(cron = "${app.birthday.notification.cron:0 0 9 * * *}")
    public void runBirthdayNotifications() {
        logger.info("Birthday notification scheduler started.");
        
        LocalDate today = LocalDate.now();
        int month = today.getMonthValue();
        int day = today.getDayOfMonth();
        
        List<UserProfile> birthdayUsers = userProfileRepository.findByBirthMonthAndDay(month, day);
        
        for (UserProfile profile : birthdayUsers) {
            try {
                String name = profile.getFullName() != null ? profile.getFullName() : "Kullanici";
                pushNotificationService.sendToUser(
                    profile.getUserId(),
                    "Iyi ki Dogdunuz! 🎂",
                    "Sayin " + name + ", yeni yasinizda saglik, mutluluk ve basari dileriz! AI Asistan yaninizda.",
                    Map.of("type", "birthday_greeting")
                );
                logger.debug("Birthday notification sent to user: {}", profile.getUserId());
            } catch (Exception e) {
                logger.error("Error sending birthday notification for user: {}", profile.getUserId(), e);
            }
        }
        
        logger.info("Birthday notification scheduler finished. Sent to {} users.", birthdayUsers.size());
    }
}
