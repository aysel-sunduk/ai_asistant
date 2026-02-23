/**
 * Kisa aciklama: Bu dosya modulin ortak parcasidir.
 */
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
                        .allowedOriginPatterns(
                            // Local dev (web)
                            "http://localhost:*",
                            "http://127.0.0.1:*",
                            // LAN dev (Expo / device)
                            "http://192.168.*.*:*",
                            "http://10.*.*.*:*",
                            // Docker / private networks
                            "http://172.16.*.*:*",
                            "http://172.17.*.*:*",
                            "http://172.18.*.*:*",
                            "http://172.19.*.*:*",
                            "http://172.20.*.*:*",
                            "http://172.21.*.*:*",
                            "http://172.22.*.*:*",
                            "http://172.23.*.*:*",
                            "http://172.24.*.*:*",
                            "http://172.25.*.*:*",
                            "http://172.26.*.*:*",
                            "http://172.27.*.*:*",
                            "http://172.28.*.*:*",
                            "http://172.29.*.*:*",
                            "http://172.30.*.*:*",
                            "http://172.31.*.*:*"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}