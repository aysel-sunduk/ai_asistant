package com.aiasistan.service;

import com.aiasistan.dto.response.InvestmentRecommendationResponse;
import com.aiasistan.model.Investment;
import com.aiasistan.model.InvestmentRecommendation;
import com.aiasistan.repository.InvestmentRecommendationRepository;
import com.aiasistan.repository.InvestmentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InvestmentRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(InvestmentRecommendationService.class);

    private final InvestmentRecommendationRepository recommendationRepository;
    private final InvestmentRepository investmentRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ML_SERVICE_URL:http://localhost:8000}")
    private String mlServiceUrl;

    public InvestmentRecommendationService(
            InvestmentRecommendationRepository recommendationRepository,
            InvestmentRepository investmentRepository,
            ObjectMapper objectMapper) {
        this.recommendationRepository = recommendationRepository;
        this.investmentRepository = investmentRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<InvestmentRecommendationResponse> getPersonalizedRecommendations(UUID userId) {
        try {
            List<Investment> holdings = investmentRepository.findByUserId(userId);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("user_id", userId.toString());
            requestBody.put("holdings", holdings.stream().map(h -> {
                Map<String, Object> item = new HashMap<>();
                item.put("symbol", h.getSymbol());
                item.put("quantity", h.getQuantity());
                item.put("value", h.getQuantity().multiply(BigDecimal.valueOf(h.getAvgCostMinor() / 100.0)));
                item.put("asset_type", h.getAssetType());
                item.put("risk_level", "MEDIUM");
                return item;
            }).collect(Collectors.toList()));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String url = mlServiceUrl + "/api/finance/recommendations/user";
            String responseStr = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(responseStr);

            if (root.path("success").asBoolean()) {
                JsonNode data = root.path("data").path("recommendations");
                List<InvestmentRecommendationResponse> out = new ArrayList<>();
                for (JsonNode node : data) {
                    out.add(InvestmentRecommendationResponse.builder()
                        .recommendationType(node.path("recommendationType").asText())
                        .assetType(node.path("assetType").asText())
                        .symbol(node.path("symbol").asText())
                        .confidenceScore(node.path("confidenceScore").decimalValue())
                        .reason(node.path("reason").asText())
                        .riskLevel(node.path("riskLevel").asText())
                        .validUntil(LocalDateTime.parse(node.path("validUntil").asText()))
                        .build());
                }
                if (!out.isEmpty()) return out;
            }
        } catch (Exception e) {
            logger.warn("ML Service error for personalized recommendations: {}. Falling back to global advice.", e.getMessage());
        }
        
        return getActiveRecommendations();
    }

    @Transactional(readOnly = true)
    public List<InvestmentRecommendationResponse> getActiveRecommendations() {
        return recommendationRepository.findByValidUntilAfter(LocalDateTime.now())
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvestmentRecommendationResponse> getHighConfidenceRecommendations(BigDecimal minScore) {
        return recommendationRepository.findHighConfidenceRecommendations(minScore)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<InvestmentRecommendationResponse> getAllRecommendations(Pageable pageable) {
        return recommendationRepository.findAllByOrderByConfidenceScoreDesc(pageable)
            .map(this::mapToResponse);
    }

    @Transactional
    public InvestmentRecommendationResponse saveRecommendation(InvestmentRecommendation recommendation) {
        InvestmentRecommendation saved = recommendationRepository.save(recommendation);
        return mapToResponse(saved);
    }

    private InvestmentRecommendationResponse mapToResponse(InvestmentRecommendation recommendation) {
        return InvestmentRecommendationResponse.builder()
            .id(recommendation.getId())
            .recommendationType(recommendation.getRecommendationType())
            .assetType(recommendation.getAssetType())
            .symbol(recommendation.getSymbol())
            .confidenceScore(recommendation.getConfidenceScore())
            .reason(recommendation.getReason())
            .riskLevel(recommendation.getRiskLevel())
            .targetPrice(recommendation.getTargetPrice())
            .validUntil(recommendation.getValidUntil())
            .build();
    }
}