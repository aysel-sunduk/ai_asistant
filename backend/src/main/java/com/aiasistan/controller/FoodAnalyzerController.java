package com.aiasistan.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.HealthLogDto;
import com.aiasistan.dto.response.FoodAnalysisResponse;
import com.aiasistan.service.HealthLogService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/v1/ai/food")
public class FoodAnalyzerController {
    private static final Logger log = LoggerFactory.getLogger(FoodAnalyzerController.class);

    @Value("${app.ai.ml-service-url:http://localhost:8000}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final HealthLogService healthLogService;

    public FoodAnalyzerController(HealthLogService healthLogService) {
        this.healthLogService = healthLogService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Yemek resmini analiz et (ML Proxy) ve sonucu kaydet")
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

            FoodAnalysisResponse analysisResult = response.getBody();

            // Analiz sonucunu health_logs tablosuna kaydet
            if (analysisResult != null) {
                try {
                    HealthLogDto.Request logRequest = new HealthLogDto.Request();
                    logRequest.setLogType("food_scan");
                    logRequest.setLogDate(LocalDate.now());
                    logRequest.setSource("ai_food_scan");

                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("food_name", analysisResult.getFoodName());
                    data.put("confidence", analysisResult.getConfidence());
                    data.put("calories", analysisResult.getCalories());
                    data.put("protein", analysisResult.getProtein());
                    data.put("fat", analysisResult.getFat());
                    data.put("carbs", analysisResult.getCarbs());
                    logRequest.setData(data);

                    healthLogService.createLog(authentication.getName(), logRequest);
                    log.info("Food scan result saved for user: {}", authentication.getName());
                } catch (Exception e) {
                    // Kaydetme hatasi analiz sonucunu etkilememeli
                    log.warn("Failed to save food scan result: {}", e.getMessage());
                }
            }

            return ResponseEntity.ok(ApiResponse.ok(analysisResult, "Resim basariyla analiz edildi"));

        } catch (Exception e) {
            log.error("Food analysis failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Analiz sirasinda bir hata olustu: " + e.getMessage()));
        }
    }

    @GetMapping("/history")
    @Operation(summary = "Gecmis yemek analiz sonuclarini listele")
    public ResponseEntity<ApiResponse<PageResponse<HealthLogDto.Response>>> getFoodScanHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(value = 100, message = "Sayfa boyutu en fazla 100 olabilir") int size) {
        log.info("Food scan history request from user: {}", authentication.getName());
        PageResponse<HealthLogDto.Response> response = healthLogService.getFoodScanHistory(
                authentication.getName(),
                PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(response, "Gecmis yemek analizleri"));
    }
}
