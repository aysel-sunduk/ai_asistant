package com.aiasistan.exception;

/**
 * Bulunamayan kaynaklar için (HTTP 404).
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}

