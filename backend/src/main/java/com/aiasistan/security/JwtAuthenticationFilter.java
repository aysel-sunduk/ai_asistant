package com.aiasistan.security;

import java.io.IOException;
import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. Header'dan "Authorization" değerini al
            String authHeader = request.getHeader("Authorization");
            String token = null;
            
            // 2. Bearer prefix'i kontrol et ve kaldır
            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);  // "Bearer " kaldırıldı (7 karakter)
            }

            // 3. Token boşsa sonraki filtreye geç
            if (!StringUtils.hasText(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            // 4. Token'ı JwtService ile doğrula
            if (!jwtService.isValid(token)) {
                logger.warn("JWT token validation failed");
                filterChain.doFilter(request, response);
                return;
            }

            // 5. Token içinden kullanıcı bilgisini (subject) çıkar
            String subject = jwtService.extractSubject(token);
            logger.debug("JWT token validated for user: {}", subject);

            // 6. Kullanıcıya geçici bir yetki tanımla (İleride DB'den roller çekilebilir)
            var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));

            // 7. Spring Security için Authentication nesnesini oluştur
            var authentication = new UsernamePasswordAuthenticationToken(
                    subject,
                    null,
                    authorities
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // 8. Kimlik doğrulanmış kullanıcıyı sisteme (SecurityContext) kaydet
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
        } catch (Exception e) {
            logger.error("JWT authentication error: {}", e.getMessage());
        }

        // 9. İsteği bir sonraki filtreye veya Controller'a ilet
        filterChain.doFilter(request, response);
    }

    /**
     * Hangi yolların bu filtreden geçmeyeceğini belirler.
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();  // Context path hariç, sadece servlet path
        return path.startsWith("/v1/auth") 
                || path.startsWith("/actuator")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs");
    }
}
