/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.exception;

/**
 * İstemciden gelen hatalı istekler için (HTTP 400).
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}