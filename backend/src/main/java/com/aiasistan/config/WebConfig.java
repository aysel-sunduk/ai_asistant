package com.aiasistan.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Mutlak yolu Windows uyumlu ve güvenli şekilde oluştur
        Path uploadPath = Paths.get("uploads/profile-pictures/").toAbsolutePath();
        String resourceLocation = "file:" + uploadPath.toString().replace("\\", "/") + "/";

        registry.addResourceHandler("/uploads/profile-pictures/**")
                .addResourceLocations(resourceLocation);
    }
}
