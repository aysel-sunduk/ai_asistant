/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.request.CurrencyHoldingRequest;
import com.aiasistan.dto.request.FavoriteCurrencyRequest;
import com.aiasistan.dto.request.PopularCurrencyRequest;
import com.aiasistan.dto.response.CurrencyHoldingResponse;
import com.aiasistan.dto.response.CurrencyHoldingSummaryResponse;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.dto.response.FinanceDashboardResponse;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.Investment;
import com.aiasistan.model.PopularCurrency;
import com.aiasistan.model.UserFavoriteCurrency;
import com.aiasistan.repository.InvestmentRepository;
import com.aiasistan.repository.PopularCurrencyRepository;
import com.aiasistan.repository.UserFavoriteCurrencyRepository;

@Service
public class FinanceMarketService {

    private static final String ASSET_TYPE_CURRENCY = "currency";

    private final CurrencyService currencyService;
    private final PopularCurrencyRepository popularCurrencyRepository;
    private final UserFavoriteCurrencyRepository userFavoriteCurrencyRepository;
    private final InvestmentRepository investmentRepository;

    public FinanceMarketService(
        CurrencyService currencyService,
        PopularCurrencyRepository popularCurrencyRepository,
        UserFavoriteCurrencyRepository userFavoriteCurrencyRepository,
        InvestmentRepository investmentRepository
    ) {
        this.currencyService = currencyService;
        this.popularCurrencyRepository = popularCurrencyRepository;
        this.userFavoriteCurrencyRepository = userFavoriteCurrencyRepository;
        this.investmentRepository = investmentRepository;
    }

    @Transactional
    public void upsertPopularCurrency(PopularCurrencyRequest request) {
        String code = normalizeCurrencyOrThrow(request.getCurrencyCode());
        PopularCurrency popularCurrency = popularCurrencyRepository.findByCurrencyCodeIgnoreCase(code)
            .orElseGet(PopularCurrency::new);

        popularCurrency.setCurrencyCode(code);
        popularCurrency.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        popularCurrency.setActive(true);
        popularCurrencyRepository.save(popularCurrency);
    }

    @Transactional
    public void removePopularCurrency(String currencyCode) {
        String code = normalizeCurrencyOrThrow(currencyCode);
        PopularCurrency popularCurrency = popularCurrencyRepository.findByCurrencyCodeIgnoreCase(code)
            .orElseThrow(() -> new NotFoundException("Popular currency not found"));
        popularCurrency.setActive(false);
        popularCurrencyRepository.save(popularCurrency);
    }

    @Transactional(readOnly = true)
    public List<CurrencyRateResponse> getPopularRates(String baseCurrency, boolean refresh) {
        String base = normalizeBaseCurrency(baseCurrency);
        List<String> popularCodes = popularCurrencyRepository.findByActiveTrueOrderBySortOrderAscCreatedAtAsc()
            .stream()
            .map(PopularCurrency::getCurrencyCode)
            .toList();

        if (popularCodes.isEmpty()) {
            popularCodes = List.of("USD", "EUR", "GBP", "CHF", "JPY");
        }
        return currencyService.getLiveRatesViaAlphaVantage(base, popularCodes, refresh);
    }

    @Transactional
    public void upsertFavoriteCurrency(UUID userId, FavoriteCurrencyRequest request) {
        String code = normalizeCurrencyOrThrow(request.getCurrencyCode());
        UserFavoriteCurrency favorite = userFavoriteCurrencyRepository
            .findByUserIdAndCurrencyCodeIgnoreCase(userId, code)
            .orElseGet(() -> userFavoriteCurrencyRepository
                .findAnyByUserIdAndCurrencyCodeIgnoreCase(userId, code)
                .orElseGet(UserFavoriteCurrency::new));

        favorite.setUserId(userId);
        favorite.setCurrencyCode(code);
        favorite.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        favorite.setDeletedAt(null);
        userFavoriteCurrencyRepository.save(favorite);
    }

    @Transactional
    public void removeFavoriteCurrency(UUID userId, String currencyCode) {
        String code = normalizeCurrencyOrThrow(currencyCode);
        userFavoriteCurrencyRepository.findByUserIdAndCurrencyCodeIgnoreCase(userId, code)
            .ifPresent(favorite -> {
                favorite.setDeletedAt(OffsetDateTime.now());
                userFavoriteCurrencyRepository.save(favorite);
            });
    }

    @Transactional(readOnly = true)
    public List<CurrencyRateResponse> getFavoriteRates(UUID userId, String baseCurrency, boolean refresh) {
        String base = normalizeBaseCurrency(baseCurrency);
        List<String> favoriteCodes = userFavoriteCurrencyRepository.findByUserIdOrderBySortOrderAscCreatedAtAsc(userId)
            .stream()
            .map(UserFavoriteCurrency::getCurrencyCode)
            .toList();

        if (favoriteCodes.isEmpty()) {
            return List.of();
        }
        return currencyService.getLatestRatesByBase(base, favoriteCodes, refresh);
    }

    @Transactional
    public CurrencyHoldingResponse addCurrencyHolding(UUID userId, CurrencyHoldingRequest request, String baseCurrency, boolean refresh) {
        String currencyCode = normalizeCurrencyOrThrow(request.getCurrencyCode());
        String costCurrency = normalizeBaseCurrency(request.getCurrency());

        Investment investment = new Investment();
        investment.setUserId(userId);
        investment.setAssetType(ASSET_TYPE_CURRENCY);
        investment.setSymbol(currencyCode);
        investment.setQuantity(request.getQuantity());
        investment.setAvgCostMinor(request.getAvgCostMinor());
        investment.setCurrency(costCurrency);
        Investment saved = investmentRepository.save(investment);

        return toHoldingResponse(saved, normalizeBaseCurrency(baseCurrency), buildRateMap(
            normalizeBaseCurrency(baseCurrency),
            List.of(currencyCode),
            refresh
        ));
    }

    @Transactional
    public CurrencyHoldingResponse updateCurrencyHolding(UUID userId, UUID holdingId, CurrencyHoldingRequest request, String baseCurrency, boolean refresh) {
        Investment investment = investmentRepository.findByIdAndUserIdAndAssetType(holdingId, userId, ASSET_TYPE_CURRENCY)
            .orElseThrow(() -> new NotFoundException("Currency holding not found"));

        String currencyCode = normalizeCurrencyOrThrow(request.getCurrencyCode());
        String costCurrency = normalizeBaseCurrency(request.getCurrency());

        investment.setSymbol(currencyCode);
        investment.setQuantity(request.getQuantity());
        investment.setAvgCostMinor(request.getAvgCostMinor());
        investment.setCurrency(costCurrency);
        Investment updated = investmentRepository.save(investment);

        return toHoldingResponse(updated, normalizeBaseCurrency(baseCurrency), buildRateMap(
            normalizeBaseCurrency(baseCurrency),
            List.of(currencyCode),
            refresh
        ));
    }

    @Transactional
    public void deleteCurrencyHolding(UUID userId, UUID holdingId) {
        Investment investment = investmentRepository.findByIdAndUserIdAndAssetType(holdingId, userId, ASSET_TYPE_CURRENCY)
            .orElseThrow(() -> new NotFoundException("Currency holding not found"));
        investment.setDeletedAt(OffsetDateTime.now());
        investmentRepository.save(investment);
    }

    @Transactional(readOnly = true)
    public PageResponse<CurrencyHoldingResponse> getCurrencyHoldings(UUID userId, Pageable pageable, String baseCurrency, boolean refresh) {
        String base = normalizeBaseCurrency(baseCurrency);
        Page<Investment> holdingPage = investmentRepository.findByUserIdAndAssetType(userId, ASSET_TYPE_CURRENCY, pageable);

        List<String> symbols = holdingPage.getContent().stream()
            .map(Investment::getSymbol)
            .distinct()
            .toList();
        Map<String, CurrencyRateResponse> rates = buildRateMap(base, symbols, refresh);

        Page<CurrencyHoldingResponse> mapped = holdingPage.map(holding -> toHoldingResponse(holding, base, rates));
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public CurrencyHoldingSummaryResponse getCurrencyHoldingSummary(UUID userId, String baseCurrency, boolean refresh) {
        String base = normalizeBaseCurrency(baseCurrency);
        List<Investment> holdings = investmentRepository.findByUserIdAndAssetTypeOrderByUpdatedAtDesc(userId, ASSET_TYPE_CURRENCY);
        List<String> symbols = holdings.stream().map(Investment::getSymbol).distinct().toList();
        Map<String, CurrencyRateResponse> rates = buildRateMap(base, symbols, refresh);

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalCurrent = BigDecimal.ZERO;
        BigDecimal totalDailyChange = BigDecimal.ZERO;

        for (Investment holding : holdings) {
            CurrencyHoldingResponse item = toHoldingResponse(holding, base, rates);
            totalCost = totalCost.add(item.getCostValue());
            totalCurrent = totalCurrent.add(item.getCurrentValue());
            totalDailyChange = totalDailyChange.add(item.getDailyChangeValue());
        }

        CurrencyHoldingSummaryResponse response = new CurrencyHoldingSummaryResponse();
        response.setBaseCurrency(base);
        response.setTotalCost(totalCost.setScale(2, RoundingMode.HALF_UP));
        response.setTotalCurrentValue(totalCurrent.setScale(2, RoundingMode.HALF_UP));
        response.setTotalDailyChange(totalDailyChange.setScale(2, RoundingMode.HALF_UP));
        response.setTotalUnrealizedPnl(totalCurrent.subtract(totalCost).setScale(2, RoundingMode.HALF_UP));
        return response;
    }

    @Transactional(readOnly = true)
    public FinanceDashboardResponse getDashboard(UUID userId, String baseCurrency, boolean refresh, Pageable pageable) {
        String base = normalizeBaseCurrency(baseCurrency);

        FinanceDashboardResponse response = new FinanceDashboardResponse();
        response.setBaseCurrency(base);
        response.setGeneratedAt(OffsetDateTime.now());
        response.setPopularRates(getPopularRates(base, refresh));
        response.setFavoriteRates(getFavoriteRates(userId, base, refresh));
        response.setHoldings(getCurrencyHoldings(userId, pageable, base, refresh));
        response.setPortfolioSummary(getCurrencyHoldingSummary(userId, base, refresh));
        return response;
    }

    private CurrencyHoldingResponse toHoldingResponse(Investment holding, String baseCurrency, Map<String, CurrencyRateResponse> ratesByCode) {
        BigDecimal quantity = holding.getQuantity() != null ? holding.getQuantity() : BigDecimal.ZERO;
        BigDecimal avgCost = toMoney(holding.getAvgCostMinor());
        BigDecimal costValue = avgCost.multiply(quantity);

        CurrencyRateResponse liveRate = ratesByCode.get(normalizeCurrencyOrThrow(holding.getSymbol()));
        BigDecimal currentRate = liveRate != null && liveRate.getRate() != null ? liveRate.getRate() : avgCost;
        BigDecimal dailyChangeUnit = liveRate != null && liveRate.getChangeRate() != null
            ? liveRate.getChangeRate()
            : BigDecimal.ZERO;

        BigDecimal currentValue = currentRate.multiply(quantity);
        BigDecimal dailyChangeValue = dailyChangeUnit.multiply(quantity);
        BigDecimal unrealizedPnl = currentValue.subtract(costValue);

        CurrencyHoldingResponse response = new CurrencyHoldingResponse();
        response.setId(holding.getId());
        response.setCurrencyCode(holding.getSymbol());
        response.setQuantity(quantity);
        response.setAvgCostMinor(holding.getAvgCostMinor());
        response.setCostCurrency(holding.getCurrency() != null ? holding.getCurrency() : baseCurrency);
        response.setCurrentRate(currentRate.setScale(4, RoundingMode.HALF_UP));
        response.setCostValue(costValue.setScale(2, RoundingMode.HALF_UP));
        response.setCurrentValue(currentValue.setScale(2, RoundingMode.HALF_UP));
        response.setDailyChangeValue(dailyChangeValue.setScale(2, RoundingMode.HALF_UP));
        response.setUnrealizedPnl(unrealizedPnl.setScale(2, RoundingMode.HALF_UP));
        response.setUpdatedAt(holding.getUpdatedAt());
        return response;
    }

    private Map<String, CurrencyRateResponse> buildRateMap(String baseCurrency, List<String> currencyCodes, boolean refresh) {
        if (currencyCodes == null || currencyCodes.isEmpty()) {
            return Map.of();
        }

        List<String> normalizedCodes = currencyCodes.stream()
            .map(this::normalizeCurrencyOrThrow)
            .distinct()
            .toList();

        return currencyService.getLatestRatesByBase(baseCurrency, normalizedCodes, refresh).stream()
            .collect(Collectors.toMap(CurrencyRateResponse::getCurrencyCode, Function.identity(), (first, second) -> first, LinkedHashMap::new));
    }

    private String normalizeCurrencyOrThrow(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank()) {
            throw new BadRequestException("Currency code zorunludur");
        }
        String normalized = currencyCode.trim().toUpperCase();
        if (!currencyService.getSupportedCurrencies().contains(normalized)) {
            throw new BadRequestException("Desteklenmeyen para birimi: " + normalized);
        }
        return normalized;
    }

    private String normalizeBaseCurrency(String baseCurrency) {
        if (baseCurrency == null || baseCurrency.isBlank()) {
            return "TRY";
        }
        return normalizeCurrencyOrThrow(baseCurrency);
    }

    private BigDecimal toMoney(Long minor) {
        if (minor == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(minor).divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
    }
}
