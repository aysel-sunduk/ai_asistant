package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.ShoppingItem;

@Repository
public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, UUID> {

    Page<ShoppingItem> findByListId(UUID listId, Pageable pageable);

    Optional<ShoppingItem> findByIdAndListId(UUID id, UUID listId);
}
