package com.aiasistan.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS (Cross-Origin Resource Sharing) yapılandırması.
 * Frontend uygulaması farklı bir port veya domaindir çalışsa bile
 * backend API'sine erişebilmesini sağlar.
 * 
 * NOT: allowCredentials(true) ile birlikte allowedOrigins("*") kullanılamaz.
 * Frontend adresini açıkça belirtmelisin.
 */
@Configuration
public class CorsConfig {
    
    /**
     * Tüm endpointler için CORS ayarlarını uygula.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(
                            "http://localhost:3000",      // React geliştirme
                            "http://localhost:3001",      // Alternative React port
                            "http://localhost:8081",      // React Native
                            "http://localhost:8080",      // Backend same origin
                            "http://127.0.0.1:3000",
                            "http://127.0.0.1:3001",
                            "http://127.0.0.1:8081",
                            "http://127.0.0.1:8080"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}
