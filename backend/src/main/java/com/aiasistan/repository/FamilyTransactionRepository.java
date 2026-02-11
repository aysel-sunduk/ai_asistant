package com.aiasistan.repository;

import com.aiasistan.common.enums.FamilyTransactionType;
import com.aiasistan.model.FamilyTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyTransactionRepository extends JpaRepository<FamilyTransaction, UUID> {

    Page<FamilyTransaction> findByUserIdOrderByOccurredOnDesc(UUID userId, Pageable pageable);

    Optional<FamilyTransaction> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COALESCE(SUM(ft.amountMinor), 0) FROM FamilyTransaction ft WHERE ft.userId = :userId AND ft.type = :type AND ft.occurredOn BETWEEN :startDate AND :endDate")
    Long sumAmountMinorByTypeAndDateRange(
        @Param("userId") UUID userId,
        @Param("type") FamilyTransactionType type,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
