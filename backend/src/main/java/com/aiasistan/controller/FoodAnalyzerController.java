package com.aiasistan.controller;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.response.FoodAnalysisResponse;

import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/v1/ai/food")
public class FoodAnalyzerController {
    private static final Logger log = LoggerFactory.getLogger(FoodAnalyzerController.class);

    @Value("${app.ai.ml-service-url:http://localhost:8000}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Yemek resmini analiz et (ML Proxy)")
    public ResponseEntity<ApiResponse<FoodAnalysisResponse>> analyzeFood(
            Authentication authentication,
            @RequestPart("file") MultipartFile file) {
        log.info("AI Food Analysis request from user: {}", authentication.getName());

        try {
            String url = mlServiceUrl + "/api/analyze-food";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<FoodAnalysisResponse> response = restTemplate.postForEntity(url, requestEntity,
                    FoodAnalysisResponse.class);

            return ResponseEntity.ok(ApiResponse.ok(response.getBody(), "Resim basariyla analiz edildi"));

        } catch (Exception e) {
            log.error("Food analysis failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Analiz sirasinda bir hata olustu: " + e.getMessage()));
        }
    }
}
