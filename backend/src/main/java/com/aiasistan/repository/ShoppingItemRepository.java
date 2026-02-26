/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import com.aiasistan.model.ShoppingItem;

@Repository
public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, UUID> {

    Page<ShoppingItem> findByList_Id(UUID listId, Pageable pageable);

    Optional<ShoppingItem> findByIdAndList_Id(UUID id, UUID listId);

    Optional<ShoppingItem> findByIdAndList_UserId(UUID id, UUID userId);

    void deleteByList_Id(UUID listId);

    long countByList_Id(UUID listId);

    long countByList_IdAndIsCheckedTrue(UUID listId);

    @Query("select coalesce(sum(i.estimatedPriceMinor), 0) from ShoppingItem i where i.list.id = :listId")
    Long sumEstimatedPriceMinorByListId(@Param("listId") UUID listId);

    @Query("select coalesce(sum(i.estimatedPriceMinor), 0) from ShoppingItem i where i.list.id = :listId and i.isChecked = true")
    Long sumCheckedEstimatedPriceMinorByListId(@Param("listId") UUID listId);
}
