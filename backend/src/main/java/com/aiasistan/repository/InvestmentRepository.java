package com.aiasistan.repository;

import com.aiasistan.model.Investment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, UUID> {
    
    List<Investment> findByUserId(UUID userId);
    
    Page<Investment> findByUserId(UUID userId, Pageable pageable);
    
    List<Investment> findByUserIdAndAssetType(UUID userId, String assetType);
    
    @Query("SELECT i FROM Investment i WHERE i.userId = :userId AND i.quantity * i.avgCostMinor IS NOT NULL")
    List<Investment> findProfitableInvestments(@Param("userId") UUID userId);
    
    @Query("SELECT SUM((i.quantity * i.avgCostMinor)) FROM Investment i WHERE i.userId = :userId")
    BigDecimal calculateTotalInvestment(@Param("userId") UUID userId);
}
