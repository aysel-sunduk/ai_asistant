/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpiryMs;
    private final long refreshExpiryMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiry-ms}") long accessExpiryMs,
            @Value("${app.jwt.refresh-expiry-ms}") long refreshExpiryMs
    ) {
        byte[] keyBytes;
        try {
            // Önce Base64 formatında çözmeyi dener
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (Exception ex) {
            // Eğer Base64 değilse (logundaki '-' hatası gibi), düz metin olarak UTF-8 ile alır
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }

        // Güvenlik uyarısı: Anahtarın en az 256 bit (32 karakter) olması gerekir.
        // Eğer kısa gelirse kütüphane hata verebilir, bu yüzden Keys.hmacShaKeyFor kullanıyoruz.
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpiryMs = accessExpiryMs;
        this.refreshExpiryMs = refreshExpiryMs;
    }

    public String generateAccessToken(String subject) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessExpiryMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public String generateRefreshToken(String subject) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(refreshExpiryMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception ex) {
            // Token süresi dolmuşsa veya imza geçersizse buraya düşer
            return false;
        }
    }

    public String extractSubject(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public Instant getExpiryInstant(String token) {
        Date expiry = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
        return expiry.toInstant();
    }
}