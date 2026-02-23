/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.request.FavoriteInvestmentRequest;
import com.aiasistan.dto.request.InvestmentRequest;
import com.aiasistan.dto.response.InvestmentPerformanceResponse;
import com.aiasistan.dto.response.InvestmentResponse;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.Investment;
import com.aiasistan.model.UserFavoriteInvestment;
import com.aiasistan.repository.InvestmentRepository;
import com.aiasistan.repository.UserFavoriteInvestmentRepository;

@Service
public class InvestmentService {
    private static final List<String> TRACKED_SYMBOLS = List.of("TRY", "USD", "EUR", "GBP");
    
    private final InvestmentRepository investmentRepository;
    private final CurrencyService currencyService;
    private final FinanceMetalSymbolService financeMetalSymbolService;
    private final UserFavoriteInvestmentRepository userFavoriteInvestmentRepository;

    public InvestmentService(
        InvestmentRepository investmentRepository,
        CurrencyService currencyService,
        FinanceMetalSymbolService financeMetalSymbolService,
        UserFavoriteInvestmentRepository userFavoriteInvestmentRepository
    ) {
        this.investmentRepository = investmentRepository;
        this.currencyService = currencyService;
        this.financeMetalSymbolService = financeMetalSymbolService;
        this.userFavoriteInvestmentRepository = userFavoriteInvestmentRepository;
    }
    
    @Transactional
    public InvestmentResponse addInvestment(UUID userId, InvestmentRequest request) {
        String assetType = normalizeAssetType(request.getAssetType());
        String symbol = normalizeSymbolForAssetType(assetType, request.getSymbol());
        Investment investment = new Investment();
        investment.setUserId(userId);
        investment.setAssetType(assetType);
        investment.setSymbol(symbol);
        investment.setQuantity(request.getQuantity());
        investment.setAvgCostMinor(request.getAvgCostMinor());
        investment.setCurrency(normalizeCurrency(request.getCurrency()));
        
        Investment saved = investmentRepository.save(investment);
        return mapToResponse(saved);
    }
    
    @Transactional
    public InvestmentResponse updateInvestmentPrice(UUID investmentId, UUID userId, Long avgCostMinor) {
        Investment investment = investmentRepository.findById(investmentId)
            .orElseThrow(() -> new NotFoundException("Investment not found with id: " + investmentId));
        
        if (!investment.getUserId().equals(userId)) {
            throw new SecurityException("You don't have permission to update this investment");
        }
        
        investment.setAvgCostMinor(avgCostMinor);
        Investment updated = investmentRepository.save(investment);
        return mapToResponse(updated);
    }
    
    @Transactional(readOnly = true)
    public PageResponse<InvestmentResponse> getUserInvestments(UUID userId, Pageable pageable) {
        Page<Investment> investmentPage = investmentRepository.findByUserId(userId, pageable);
        return PageResponse.of(investmentPage.map(this::mapToResponse));
    }
    
    @Transactional(readOnly = true)
    public InvestmentResponse getInvestment(UUID id, UUID userId) {
        Investment investment = investmentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Investment not found with id: " + id));
        
        if (!investment.getUserId().equals(userId)) {
            throw new SecurityException("You don't have permission to view this investment");
        }
        
        return mapToResponse(investment);
    }

    @Transactional
    public void upsertFavoriteInvestment(UUID userId, FavoriteInvestmentRequest request) {
        UUID investmentId = request.getInvestmentId();
        investmentRepository.findByIdAndUserId(investmentId, userId)
            .orElseThrow(() -> new NotFoundException("Investment not found with id: " + investmentId));

        UserFavoriteInvestment favorite = userFavoriteInvestmentRepository
            .findByUserIdAndInvestmentId(userId, investmentId)
            .orElseGet(UserFavoriteInvestment::new);

        favorite.setUserId(userId);
        favorite.setInvestmentId(investmentId);
        favorite.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        userFavoriteInvestmentRepository.save(favorite);
    }

    @Transactional
    public void removeFavoriteInvestment(UUID userId, UUID investmentId) {
        userFavoriteInvestmentRepository.deleteByUserIdAndInvestmentId(userId, investmentId);
    }

    @Transactional(readOnly = true)
    public List<InvestmentResponse> getFavoriteInvestments(UUID userId) {
        List<UserFavoriteInvestment> favorites = userFavoriteInvestmentRepository
            .findByUserIdOrderBySortOrderAscCreatedAtAsc(userId);

        if (favorites.isEmpty()) {
            return List.of();
        }

        List<UUID> investmentIds = favorites.stream()
            .map(UserFavoriteInvestment::getInvestmentId)
            .toList();

        Map<UUID, Investment> investmentsById = new HashMap<>();
        for (Investment investment : investmentRepository.findByUserIdAndIdIn(userId, investmentIds)) {
            investmentsById.put(investment.getId(), investment);
        }

        return favorites.stream()
            .map(favorite -> investmentsById.get(favorite.getInvestmentId()))
            .filter(investment -> investment != null)
            .map(this::mapToResponse)
            .toList();
    }
    
    @Transactional
    public void deleteInvestment(UUID id, UUID userId) {
        Investment investment = investmentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Investment not found with id: " + id));
        
        if (!investment.getUserId().equals(userId)) {
            throw new SecurityException("You don't have permission to delete this investment");
        }
        
        investmentRepository.delete(investment);
    }
    
    @Transactional(readOnly = true)
    public BigDecimal getTotalInvestment(UUID userId) {
        BigDecimal total = investmentRepository.calculateTotalInvestment(userId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional
    public InvestmentPerformanceResponse getPortfolioPerformance(UUID userId) {
        List<Investment> investments = investmentRepository.findByUserId(userId);

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal estimatedCurrentValue = BigDecimal.ZERO;
        BigDecimal dailyChange = BigDecimal.ZERO;
        Map<String, BigDecimal> valueByAssetType = new LinkedHashMap<>();

        for (Investment investment : investments) {
            BigDecimal avgCost = toMoney(investment.getAvgCostMinor());
            BigDecimal quantity = investment.getQuantity() != null ? investment.getQuantity() : BigDecimal.ZERO;
            BigDecimal costValue = avgCost.multiply(quantity);
            totalCost = totalCost.add(costValue);

            BigDecimal currentUnitPrice = resolveCurrentUnitPrice(investment, avgCost);
            BigDecimal currentValue = currentUnitPrice.multiply(quantity);
            estimatedCurrentValue = estimatedCurrentValue.add(currentValue);

            BigDecimal perDayChange = resolveDailyChange(investment);
            dailyChange = dailyChange.add(perDayChange.multiply(quantity));

            String assetType = investment.getAssetType() != null ? investment.getAssetType() : "unknown";
            valueByAssetType.merge(assetType, currentValue, BigDecimal::add);
        }

        BigDecimal unrealizedPnl = estimatedCurrentValue.subtract(totalCost);
        Map<String, BigDecimal> allocationPct = new LinkedHashMap<>();
        if (estimatedCurrentValue.compareTo(BigDecimal.ZERO) > 0) {
            for (Map.Entry<String, BigDecimal> entry : valueByAssetType.entrySet()) {
                BigDecimal pct = entry.getValue()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(estimatedCurrentValue, 2, RoundingMode.HALF_UP);
                allocationPct.put(entry.getKey(), pct);
            }
        }

        InvestmentPerformanceResponse response = new InvestmentPerformanceResponse();
        response.setTotalCost(totalCost.setScale(2, RoundingMode.HALF_UP));
        response.setEstimatedCurrentValue(estimatedCurrentValue.setScale(2, RoundingMode.HALF_UP));
        response.setUnrealizedPnl(unrealizedPnl.setScale(2, RoundingMode.HALF_UP));
        response.setDailyChange(dailyChange.setScale(2, RoundingMode.HALF_UP));
        response.setAllocationByAssetTypePct(allocationPct);
        return response;
    }
    
    private InvestmentResponse mapToResponse(Investment investment) {
        BigDecimal currentValue = BigDecimal.ZERO;
        if (investment.getAvgCostMinor() != null) {
            currentValue = BigDecimal.valueOf(investment.getAvgCostMinor())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(investment.getQuantity());
        }
        
        return InvestmentResponse.builder()
            .id(investment.getId())
            .assetType(investment.getAssetType())
            .symbol(investment.getSymbol())
            .quantity(investment.getQuantity())
            .avgCostMinor(investment.getAvgCostMinor())
            .currentValue(currentValue)
            .currency(investment.getCurrency() != null ? normalizeCurrency(investment.getCurrency()) : "TRY")
            .updatedAt(investment.getUpdatedAt())
            .build();
    }

    private BigDecimal toMoney(Long minor) {
        if (minor == null) return BigDecimal.ZERO;
        return BigDecimal.valueOf(minor).divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveCurrentUnitPrice(Investment investment, BigDecimal fallbackPrice) {
        String symbolCode = parseCurrencySymbol(investment.getSymbol());
        if (symbolCode == null) return fallbackPrice;
        String baseCurrency = normalizeCurrency(investment.getCurrency());
        try {
            CurrencyRateResponse live = currencyService.getLiveRate(baseCurrency, symbolCode);
            if (live != null && live.getRate() != null) {
                return live.getRate();
            }
        } catch (Exception ignored) {
        }
        return fallbackPrice;
    }

    private BigDecimal resolveDailyChange(Investment investment) {
        String symbolCode = parseCurrencySymbol(investment.getSymbol());
        if (symbolCode == null) return BigDecimal.ZERO;
        String baseCurrency = normalizeCurrency(investment.getCurrency());
        try {
            CurrencyRateResponse live = currencyService.getLiveRate(baseCurrency, symbolCode);
            if (live != null && live.getChangeRate() != null) {
                return live.getChangeRate();
            }
        } catch (Exception ignored) {
        }
        return BigDecimal.ZERO;
    }

    private String parseCurrencySymbol(String symbol) {
        if (symbol == null || symbol.isBlank()) return null;
        String normalized = symbol.trim().toUpperCase();
        if (TRACKED_SYMBOLS.contains(normalized) || financeMetalSymbolService.isActiveMetalCode(normalized)) {
            return normalized;
        }
        return null;
    }

    private String normalizeAssetType(String assetType) {
        if (assetType == null || assetType.isBlank()) {
            return "unknown";
        }
        return assetType.trim().toLowerCase();
    }

    private String normalizeSymbolForAssetType(String assetType, String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new BadRequestException("Symbol is required");
        }
        String normalizedSymbol = symbol.trim().toUpperCase();
        if ("metal".equals(assetType) && !financeMetalSymbolService.isActiveMetalCode(normalizedSymbol)) {
            throw new BadRequestException("Secilen metal sembolu desteklenmiyor");
        }
        return normalizedSymbol;
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "TRY";
        }
        String normalized = currency.trim().toUpperCase();
        return TRACKED_SYMBOLS.contains(normalized) ? normalized : "TRY";
    }
}