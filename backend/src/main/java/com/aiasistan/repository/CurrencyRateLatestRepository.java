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

    List<CurrencyRateLatest> findByBaseCurrencyOrderByCurrencyCodeAsc(String baseCurrency);

    Optional<CurrencyRateLatest> findTopByCurrencyCodeOrderByRateDateDesc(String currencyCode);
}
