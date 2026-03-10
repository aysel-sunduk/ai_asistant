/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.HealthLogDto;
import com.aiasistan.dto.response.DailyNutritionResponse;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.HealthLog;
import com.aiasistan.repository.HealthLogRepository;

@Service
public class HealthLogService {

    private static final Set<String> ALLOWED_LOG_TYPES = Set.of(
            "daily_summary",
            "water",
            "exercise",
            "meal",
            "food_scan",
            "steps",
            "distance",
            "active_calories",
            "resting_calories",
            "heart_rate",
            "sleep");
    private static final Set<String> ALLOWED_SOURCES = Set.of(
            "manual",
            "mobile_device",
            "apple_health",
            "apple_healthkit",
            "google_fit",
            "health_connect",
            "ai_food_scan",
            "other");

    private final HealthLogRepository healthLogRepository;
    private final UserService userService;

    public HealthLogService(HealthLogRepository healthLogRepository, UserService userService) {
        this.healthLogRepository = healthLogRepository;
        this.userService = userService;
    }

    @Transactional
    public HealthLogDto.Response createLog(String userEmail, HealthLogDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        String normalizedType = normalizeLogType(request.getLogType());
        String normalizedSource = normalizeSource(request.getSource());
        String externalRecordId = normalizeExternalRecordId(request.getExternalRecordId());
        // Kısa debug: hangi alanların geldiğini logla (sunucu tarafı izleme için)
        org.slf4j.LoggerFactory.getLogger(HealthLogService.class)
                .debug("createLog: user={}, externalRecordId={}, type={}, source={}, dataKeys={}",
                        userEmail, externalRecordId, normalizedType, normalizedSource,
                        request.getData() != null ? request.getData().keySet() : null);
        validateDataByType(normalizedType, request.getData());
        if (externalRecordId != null) {
            return healthLogRepository.findByUserIdAndExternalRecordId(userId, externalRecordId)
                    .map(existing -> {
                        // Log ve geri dönüş: dış kayıt id'si zaten varsa yeni kayıt oluşturulmaz
                        // Bu sayede istemcinin senkronize ederken neden "yeni veri yok" gördüğünü
                        // sunucu loglarından takip edebiliriz.
                        // Not: performans için sadece bilgi amaçlı log basılır.
                        // (Kısa ve tek satırlık log)
                        org.slf4j.LoggerFactory.getLogger(HealthLogService.class)
                                .info("Existing health log for externalRecordId={}", externalRecordId);
                        return HealthLogDto.Response.from(existing);
                    })
                    .orElseGet(() -> {
                        org.slf4j.LoggerFactory.getLogger(HealthLogService.class)
                                .info("Saving new health log for externalRecordId={}", externalRecordId);
                        return saveNewHealthLog(userId, normalizedType, request, normalizedSource, externalRecordId);
                    });
        }

        org.slf4j.LoggerFactory.getLogger(HealthLogService.class)
                .info("Saving new health log without externalRecordId");
        return saveNewHealthLog(userId, normalizedType, request, normalizedSource, null);
    }

    private HealthLogDto.Response saveNewHealthLog(
            UUID userId,
            String normalizedType,
            HealthLogDto.Request request,
            String normalizedSource,
            String externalRecordId) {
        HealthLog healthLog = new HealthLog();
        healthLog.setUserId(userId);
        healthLog.setLogType(normalizedType);
        healthLog.setLogDate(request.getLogDate() != null ? request.getLogDate() : LocalDate.now());
        healthLog.setSource(normalizedSource);
        healthLog.setExternalRecordId(externalRecordId);
        healthLog.setData(request.getData());

        return HealthLogDto.Response.from(healthLogRepository.save(healthLog));
    }

    @Transactional(readOnly = true)
    public HealthLogDto.Response getLogById(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        HealthLog healthLog = findOwnedLog(id, userId);
        return HealthLogDto.Response.from(healthLog);
    }

    @Transactional(readOnly = true)
    public PageResponse<HealthLogDto.Response> getLogs(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<HealthLogDto.Response> page = healthLogRepository.findByUserId(userId, pageable)
                .map(HealthLogDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<HealthLogDto.Response> getLogsByDateRange(String userEmail, LocalDate startDate, LocalDate endDate,
            String logType) {
        validateDateRange(startDate, endDate);
        UUID userId = userService.getUserIdByEmail(userEmail);

        List<HealthLog> logs;
        if (logType != null && !logType.isBlank()) {
            String normalizedType = normalizeLogType(logType);
            logs = healthLogRepository.findByUserIdAndTypeAndDateRange(userId, normalizedType, startDate, endDate);
        } else {
            logs = healthLogRepository.findByUserIdAndDateRange(userId, startDate, endDate);
        }

        return logs.stream().map(HealthLogDto.Response::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<HealthLogDto.Response> getFoodScanHistory(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<HealthLogDto.Response> page = healthLogRepository
                .findByUserIdAndLogTypeOrderByLoggedAtDesc(userId, "food_scan", pageable)
                .map(HealthLogDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public DailyNutritionResponse getDailyNutrition(String userEmail, LocalDate date) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        List<HealthLog> logs = healthLogRepository.findByUserIdAndDateRange(userId, date, date);

        double calories = 0;
        double protein = 0;
        double carbs = 0;
        double fat = 0;
        int mealCount = 0;

        for (HealthLog healthLog : logs) {
            if ("food_scan".equals(healthLog.getLogType()) || "meal".equals(healthLog.getLogType())) {
                Map<String, Object> data = healthLog.getData();
                if (data != null) {
                    calories += parseDouble(data.get("calories"), data.get("kcal"));
                    protein += parseDouble(data.get("protein"), data.get("protein_g"));
                    carbs += parseDouble(data.get("carbs"), data.get("carbs_g"));
                    fat += parseDouble(data.get("fat"), data.get("fat_g"));
                    mealCount++;
                }
            }
        }

        return new DailyNutritionResponse(
                Math.round(calories * 10.0) / 10.0,
                Math.round(protein * 10.0) / 10.0,
                Math.round(carbs * 10.0) / 10.0,
                Math.round(fat * 10.0) / 10.0,
                mealCount
        );
    }

    private double parseDouble(Object... values) {
        for (Object v : values) {
            if (v instanceof Number number) return number.doubleValue();
            if (v instanceof String s) {
                try {
                    return Double.parseDouble(s);
                } catch (NumberFormatException ignored) {}
            }
        }
        return 0.0;
    }

    @Transactional
    public HealthLogDto.Response updateLog(String userEmail, UUID id, HealthLogDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        HealthLog healthLog = findOwnedLog(id, userId);
        String normalizedType = normalizeLogType(request.getLogType());
        validateDataByType(normalizedType, request.getData());

        healthLog.setLogType(normalizedType);
        healthLog.setLogDate(request.getLogDate() != null ? request.getLogDate() : healthLog.getLogDate());
        healthLog.setSource(normalizeSource(request.getSource()));
        healthLog.setExternalRecordId(normalizeExternalRecordId(request.getExternalRecordId()));
        healthLog.setData(request.getData());

        return HealthLogDto.Response.from(healthLogRepository.save(healthLog));
    }

    @Transactional
    public void deleteLog(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        HealthLog healthLog = findOwnedLog(id, userId);
        healthLog.setDeletedAt(java.time.OffsetDateTime.now());
        healthLogRepository.save(healthLog);
    }

    private HealthLog findOwnedLog(UUID id, UUID userId) {
        return healthLogRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Saglik kaydi bulunamadi"));
    }

    private String normalizeLogType(String logType) {
        String normalized = logType == null ? "" : logType.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_LOG_TYPES.contains(normalized)) {
            throw new BadRequestException(
                    "Gecersiz logType. Desteklenen: daily_summary, water, exercise, meal, food_scan, steps, distance, active_calories, resting_calories, heart_rate, sleep");
        }
        return normalized;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new BadRequestException("Baslangic ve bitis tarihi zorunludur");
        }
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("Bitis tarihi baslangic tarihinden once olamaz");
        }
    }

    private String normalizeSource(String source) {
        String normalized = source == null ? "manual" : source.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_SOURCES.contains(normalized)) {
            throw new BadRequestException(
                    "Gecersiz source. Desteklenen: manual, mobile_device, apple_health, apple_healthkit, google_fit, health_connect, ai_food_scan, other");
        }
        return normalized;
    }

    private String normalizeExternalRecordId(String externalRecordId) {
        if (externalRecordId == null) {
            return null;
        }
        String value = externalRecordId.trim();
        return value.isEmpty() ? null : value;
    }

    private void validateDataByType(String logType, Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            throw new BadRequestException("Veri alani bos olamaz");
        }

        switch (logType) {
            case "water" -> requirePositiveNumberAny(data, "amount_ml", "amountMl");
            case "exercise" -> requirePositiveNumberAny(data, "duration_min", "durationMin");
            case "meal" -> requireNonBlankStringAny(data, "meal_type", "mealType");
            case "food_scan" -> requireNonBlankStringAny(data, "food_name", "foodName");
            case "daily_summary" ->
                requireAnyPresent(data, "mood", "sleep_hours", "sleepHours", "weight_kg", "weightKg", "steps");
            case "steps" -> requirePositiveNumber(data, "count");
            case "distance" -> requirePositiveNumber(data, "kilometers");
            case "active_calories", "resting_calories" -> requirePositiveNumber(data, "kcal");
            case "heart_rate" -> requirePositiveNumber(data, "bpm");
            case "sleep" -> requirePositiveNumber(data, "minutes");
            default -> throw new BadRequestException("Desteklenmeyen log tipi");
        }
    }

    private void requirePositiveNumber(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (!(value instanceof Number number) || number.doubleValue() <= 0) {
            throw new BadRequestException(key + " pozitif sayi olmalidir");
        }
    }

    private void requirePositiveNumberAny(Map<String, Object> data, String... keys) {
        for (String key : keys) {
            Object value = data.get(key);
            if (value instanceof Number number && number.doubleValue() > 0) {
                return;
            }
        }
        throw new BadRequestException(keys[0] + " pozitif sayi olmalidir");
    }

    private void requireNonBlankString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (!(value instanceof String text) || text.isBlank()) {
            throw new BadRequestException(key + " zorunludur");
        }
    }

    private void requireNonBlankStringAny(Map<String, Object> data, String... keys) {
        for (String key : keys) {
            Object value = data.get(key);
            if (value instanceof String text && !text.isBlank()) {
                return;
            }
        }
        throw new BadRequestException(keys[0] + " zorunludur");
    }

    private void requireAnyPresent(Map<String, Object> data, String... keys) {
        for (String key : keys) {
            Object value = data.get(key);
            if (value != null) {
                if (value instanceof String text && text.isBlank()) {
                    continue;
                }
                return;
            }
        }
        throw new BadRequestException("daily_summary icin en az bir alan zorunludur");
    }
}
