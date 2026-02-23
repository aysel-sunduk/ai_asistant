/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import com.aiasistan.dto.response.InvestmentRecommendationResponse;
import com.aiasistan.model.InvestmentRecommendation;
import com.aiasistan.repository.InvestmentRecommendationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvestmentRecommendationService {
    
    private final InvestmentRecommendationRepository recommendationRepository;

    public InvestmentRecommendationService(InvestmentRecommendationRepository recommendationRepository) {
        this.recommendationRepository = recommendationRepository;
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
    
    // Bu metod harici bir AI servisi tarafından çağrılacak
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