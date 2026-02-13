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
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.HealthLog;
import com.aiasistan.repository.HealthLogRepository;

@Service
public class HealthLogService {

    private static final Set<String> ALLOWED_LOG_TYPES = Set.of("daily_summary", "water", "exercise", "meal");

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
        validateDataByType(normalizedType, request.getData());

        HealthLog healthLog = new HealthLog();
        healthLog.setUserId(userId);
        healthLog.setLogType(normalizedType);
        healthLog.setLogDate(request.getLogDate() != null ? request.getLogDate() : LocalDate.now());
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
    public List<HealthLogDto.Response> getLogsByDateRange(String userEmail, LocalDate startDate, LocalDate endDate, String logType) {
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

    @Transactional
    public HealthLogDto.Response updateLog(String userEmail, UUID id, HealthLogDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        HealthLog healthLog = findOwnedLog(id, userId);
        String normalizedType = normalizeLogType(request.getLogType());
        validateDataByType(normalizedType, request.getData());

        healthLog.setLogType(normalizedType);
        healthLog.setLogDate(request.getLogDate() != null ? request.getLogDate() : healthLog.getLogDate());
        healthLog.setData(request.getData());

        return HealthLogDto.Response.from(healthLogRepository.save(healthLog));
    }

    @Transactional
    public void deleteLog(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        HealthLog healthLog = findOwnedLog(id, userId);
        healthLogRepository.delete(healthLog);
    }

    private HealthLog findOwnedLog(UUID id, UUID userId) {
        return healthLogRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Saglik kaydi bulunamadi"));
    }

    private String normalizeLogType(String logType) {
        String normalized = logType == null ? "" : logType.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_LOG_TYPES.contains(normalized)) {
            throw new BadRequestException("Gecersiz logType. Desteklenen: daily_summary, water, exercise, meal");
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

    private void validateDataByType(String logType, Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            throw new BadRequestException("Veri alani bos olamaz");
        }

        switch (logType) {
            case "water" -> requirePositiveNumber(data, "amountMl");
            case "exercise" -> requirePositiveNumber(data, "durationMin");
            case "meal" -> requireNonBlankString(data, "mealType");
            case "daily_summary" -> {
                requirePositiveNumber(data, "calories");
                requirePositiveNumber(data, "waterMl");
            }
            default -> throw new BadRequestException("Desteklenmeyen log tipi");
        }
    }

    private void requirePositiveNumber(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (!(value instanceof Number number) || number.doubleValue() <= 0) {
            throw new BadRequestException(key + " pozitif sayi olmalidir");
        }
    }

    private void requireNonBlankString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (!(value instanceof String text) || text.isBlank()) {
            throw new BadRequestException(key + " zorunludur");
        }
    }
}
