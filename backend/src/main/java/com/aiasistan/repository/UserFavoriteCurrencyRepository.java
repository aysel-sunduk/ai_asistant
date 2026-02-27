/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import com.aiasistan.model.UserFavoriteCurrency;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFavoriteCurrencyRepository extends JpaRepository<UserFavoriteCurrency, UUID> {

    List<UserFavoriteCurrency> findByUserIdOrderBySortOrderAscCreatedAtAsc(UUID userId);

    Optional<UserFavoriteCurrency> findByUserIdAndCurrencyCodeIgnoreCase(UUID userId, String currencyCode);

    @Query(value = """
        SELECT *
        FROM finance_user_favorite_currencies
        WHERE user_id = :userId
          AND lower(currency_code) = lower(:currencyCode)
        LIMIT 1
        """, nativeQuery = true)
    Optional<UserFavoriteCurrency> findAnyByUserIdAndCurrencyCodeIgnoreCase(
        @Param("userId") UUID userId,
        @Param("currencyCode") String currencyCode
    );

    void deleteByUserIdAndCurrencyCodeIgnoreCase(UUID userId, String currencyCode);
}
