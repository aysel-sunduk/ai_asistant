/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.exception;

/**
 * Çakışma durumları için (HTTP 409), örn. aynı email ile kayıt.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}