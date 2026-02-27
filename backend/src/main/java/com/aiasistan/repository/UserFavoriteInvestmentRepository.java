/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.UserFavoriteInvestment;

@Repository
public interface UserFavoriteInvestmentRepository extends JpaRepository<UserFavoriteInvestment, UUID> {

    List<UserFavoriteInvestment> findByUserIdOrderBySortOrderAscCreatedAtAsc(UUID userId);

    Optional<UserFavoriteInvestment> findByUserIdAndInvestmentId(UUID userId, UUID investmentId);

    @Query(value = """
        SELECT *
        FROM finance_user_favorite_investments
        WHERE user_id = :userId
          AND investment_id = :investmentId
        LIMIT 1
        """, nativeQuery = true)
    Optional<UserFavoriteInvestment> findAnyByUserIdAndInvestmentId(
        @Param("userId") UUID userId,
        @Param("investmentId") UUID investmentId
    );

    void deleteByUserIdAndInvestmentId(UUID userId, UUID investmentId);
}
