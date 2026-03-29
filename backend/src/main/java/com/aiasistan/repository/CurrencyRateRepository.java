/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import com.aiasistan.model.CurrencyRate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurrencyRateRepository extends JpaRepository<CurrencyRate, UUID> {
    
    Optional<CurrencyRate> findTopByCurrencyCodeOrderByRateDateDesc(String currencyCode);

    Optional<CurrencyRate> findTopByCurrencyCodeAndBaseCurrencyOrderByRateDateDesc(
        String currencyCode, String baseCurrency);

    Optional<CurrencyRate> findTopByCurrencyCodeAndBaseCurrencyAndMarketAndSourceOrderByRateDateDesc(
        String currencyCode, String baseCurrency, String market, String source);

    Optional<CurrencyRate> findTopByCurrencyCodeAndBaseCurrencyAndMarketOrderByRateDateDesc(
        String currencyCode, String baseCurrency, String market);

    List<CurrencyRate> findTop100ByCurrencyCodeAndBaseCurrencyAndMarketOrderByRateDateDesc(
        String currencyCode, String baseCurrency, String market);

    Optional<CurrencyRate> findTopByCurrencyCodeAndBaseCurrencyAndMarketAndRateDateBeforeOrderByRateDateDesc(
        String currencyCode, String baseCurrency, String market, LocalDateTime date);

    Optional<CurrencyRate> findFirstByCurrencyCodeAndBaseCurrencyAndMarketAndRateDateAfterOrderByRateDateAsc(
        String currencyCode, String baseCurrency, String market, LocalDateTime date);
    
    @Query("SELECT cr FROM CurrencyRate cr WHERE cr.rateDate >= :date")
    List<CurrencyRate> findRatesFromLast24Hours(@Param("date") LocalDateTime date);
    
    Page<CurrencyRate> findAllByOrderByRateDateDesc(Pageable pageable);

    List<CurrencyRate> findByCurrencyCodeAndRateDateBetweenOrderByRateDateDesc(
        String currencyCode, LocalDateTime startDate, LocalDateTime endDate);

    List<CurrencyRate> findByCurrencyCodeAndBaseCurrencyAndRateDateBetweenOrderByRateDateDesc(
        String currencyCode, String baseCurrency, LocalDateTime startDate, LocalDateTime endDate);

    long deleteByRateDateBefore(LocalDateTime cutoffDate);
}
