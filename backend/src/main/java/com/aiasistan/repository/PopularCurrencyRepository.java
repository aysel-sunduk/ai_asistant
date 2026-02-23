/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import com.aiasistan.model.PopularCurrency;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PopularCurrencyRepository extends JpaRepository<PopularCurrency, UUID> {

    List<PopularCurrency> findByActiveTrueOrderBySortOrderAscCreatedAtAsc();

    Optional<PopularCurrency> findByCurrencyCodeIgnoreCase(String currencyCode);
}