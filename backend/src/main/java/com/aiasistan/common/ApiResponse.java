package com.aiasistan.common;

import java.time.Instant;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * API cevaplarını sarmalamak için basit, generic response modeli.
 * Lombok gerektirmez, derleme hatası riskini sıfıra indirir.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;
    private final String errorCode;
    private final Instant timestamp;

    // Jackson (JSON serileştirme) için bazen private boş constructor gerekebilir
    private ApiResponse() {
        this.success = false;
        this.message = null;
        this.data = null;
        this.errorCode = null;
        this.timestamp = Instant.now();
    }

    private ApiResponse(boolean success, String message, T data) {
        this(success, message, data, null);
    }

    private ApiResponse(boolean success, String message, T data, String errorCode) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
        this.timestamp = Instant.now();
    }

    // Başarılı cevaplar için static factory metodları
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }

    // Hatalı cevaplar için static factory metodları
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, null);
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, message, null, errorCode);
    }

    // Getter Metodları (JSON çıktısı için gereklidir)
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public T getData() { return data; }
    public String getErrorCode() { return errorCode; }
    public Instant getTimestamp() { return timestamp; }
}