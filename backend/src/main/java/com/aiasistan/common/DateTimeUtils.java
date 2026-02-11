package com.aiasistan.common;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public class DateTimeUtils {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    
    public static String formatDate(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_FORMATTER) : null;
    }
    
    public static String formatDateTime(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_TIME_FORMATTER) : null;
    }
    
    public static String formatTime(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.format(TIME_FORMATTER) : null;
    }
    
    public static OffsetDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
    }
    
    public static OffsetDateTime endOfDay(LocalDate date) {
        return date.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);
    }
    
    public static long daysBetween(OffsetDateTime start, OffsetDateTime end) {
        return ChronoUnit.DAYS.between(start, end);
    }
    
    public static boolean isToday(OffsetDateTime dateTime) {
        return dateTime.toLocalDate().isEqual(LocalDate.now(ZoneOffset.UTC));
    }
    
    public static boolean isFuture(OffsetDateTime dateTime) {
        return dateTime.isAfter(OffsetDateTime.now(ZoneOffset.UTC));
    }
    
    public static boolean isPast(OffsetDateTime dateTime) {
        return dateTime.isBefore(OffsetDateTime.now(ZoneOffset.UTC));
    }
    
    public static OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }
}