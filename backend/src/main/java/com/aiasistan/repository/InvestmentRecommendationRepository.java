/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.InvestmentRecommendation;

@Repository
public interface InvestmentRecommendationRepository extends JpaRepository<InvestmentRecommendation, UUID> {
    
    List<InvestmentRecommendation> findByValidUntilAfter(LocalDateTime date);
    
    @Query("SELECT ir FROM InvestmentRecommendation ir WHERE ir.confidenceScore >= :minScore AND ir.validUntil > CURRENT_TIMESTAMP")
    List<InvestmentRecommendation> findHighConfidenceRecommendations(@Param("minScore") BigDecimal minScore);
    
    Page<InvestmentRecommendation> findAllByOrderByConfidenceScoreDesc(Pageable pageable);
}