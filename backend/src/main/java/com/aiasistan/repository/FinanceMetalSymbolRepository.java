package com.aiasistan.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.FinanceMetalSymbol;

@Repository
public interface FinanceMetalSymbolRepository extends JpaRepository<FinanceMetalSymbol, UUID> {

    List<FinanceMetalSymbol> findByIsActiveTrueOrderBySortOrderAscCreatedAtAsc();

    Optional<FinanceMetalSymbol> findByCodeIgnoreCaseAndIsActiveTrue(String code);
}
