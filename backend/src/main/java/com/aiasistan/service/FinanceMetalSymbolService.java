/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.response.FinanceMetalSymbolResponse;
import com.aiasistan.model.FinanceMetalSymbol;
import com.aiasistan.repository.FinanceMetalSymbolRepository;

@Service
public class FinanceMetalSymbolService {

    private final FinanceMetalSymbolRepository financeMetalSymbolRepository;

    public FinanceMetalSymbolService(FinanceMetalSymbolRepository financeMetalSymbolRepository) {
        this.financeMetalSymbolRepository = financeMetalSymbolRepository;
    }

    @Transactional(readOnly = true)
    public List<FinanceMetalSymbol> getActiveSymbols() {
        return financeMetalSymbolRepository.findByIsActiveTrueOrderBySortOrderAscCreatedAtAsc();
    }

    @Transactional(readOnly = true)
    public List<FinanceMetalSymbolResponse> getActiveSymbolResponses() {
        return getActiveSymbols().stream()
            .map(s -> new FinanceMetalSymbolResponse(s.getCode(), s.getDisplayName(), s.getSortOrder()))
            .toList();
    }

    @Transactional(readOnly = true)
    public Set<String> getActiveCodes() {
        return getActiveSymbols().stream()
            .map(FinanceMetalSymbol::getCode)
            .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public boolean isActiveMetalCode(String code) {
        return financeMetalSymbolRepository.findByCodeIgnoreCaseAndIsActiveTrue(code).isPresent();
    }

    @Transactional(readOnly = true)
    public Map<String, FinanceMetalSymbol> getCollectApiNameIndex() {
        return getActiveSymbols().stream()
            .collect(Collectors.toMap(
                s -> normalizeCollectApiName(s.getCollectApiName()),
                Function.identity(),
                (left, right) -> left
            ));
    }

    public String normalizeCollectApiName(String name) {
        if (name == null) {
            return "";
        }
        String normalized = name.toLowerCase()
            .replace("ı", "i")
            .replace("ç", "c")
            .replace("ğ", "g")
            .replace("ş", "s")
            .replace("ö", "o")
            .replace("ü", "u");
        return normalized.replaceAll("\\s+", " ").trim();
    }
}