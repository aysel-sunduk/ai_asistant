/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.UserFavoriteInvestment;

@Repository
public interface UserFavoriteInvestmentRepository extends JpaRepository<UserFavoriteInvestment, UUID> {

    List<UserFavoriteInvestment> findByUserIdOrderBySortOrderAscCreatedAtAsc(UUID userId);

    Optional<UserFavoriteInvestment> findByUserIdAndInvestmentId(UUID userId, UUID investmentId);

    void deleteByUserIdAndInvestmentId(UUID userId, UUID investmentId);
}