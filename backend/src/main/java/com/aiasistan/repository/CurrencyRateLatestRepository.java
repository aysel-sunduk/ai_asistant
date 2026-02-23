/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.CurrencyRateLatest;

@Repository
public interface CurrencyRateLatestRepository extends JpaRepository<CurrencyRateLatest, UUID> {

    Optional<CurrencyRateLatest> findByBaseCurrencyAndCurrencyCode(String baseCurrency, String currencyCode);
    Optional<CurrencyRateLatest> findByBaseCurrencyAndCurrencyCodeAndMarket(String baseCurrency, String currencyCode, String market);

    List<CurrencyRateLatest> findByBaseCurrencyOrderByCurrencyCodeAsc(String baseCurrency);
    List<CurrencyRateLatest> findByBaseCurrencyAndMarketOrderByCurrencyCodeAsc(String baseCurrency, String market);

    Optional<CurrencyRateLatest> findTopByCurrencyCodeOrderByRateDateDesc(String currencyCode);
}