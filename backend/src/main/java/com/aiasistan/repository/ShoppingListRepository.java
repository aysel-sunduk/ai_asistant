package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.ShoppingList;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

    Page<ShoppingList> findByUserId(UUID userId, Pageable pageable);

    Optional<ShoppingList> findByIdAndUserId(UUID id, UUID userId);
}
