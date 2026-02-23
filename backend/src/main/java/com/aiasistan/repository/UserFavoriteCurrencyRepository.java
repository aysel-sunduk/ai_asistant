/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import com.aiasistan.model.UserFavoriteCurrency;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFavoriteCurrencyRepository extends JpaRepository<UserFavoriteCurrency, UUID> {

    List<UserFavoriteCurrency> findByUserIdOrderBySortOrderAscCreatedAtAsc(UUID userId);

    Optional<UserFavoriteCurrency> findByUserIdAndCurrencyCodeIgnoreCase(UUID userId, String currencyCode);

    void deleteByUserIdAndCurrencyCodeIgnoreCase(UUID userId, String currencyCode);
}