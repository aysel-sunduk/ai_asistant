/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.request.CurrencyRateRequest;
import com.aiasistan.dto.response.CurrencyPairDailyDetailResponse;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.model.CurrencyRate;
import com.aiasistan.model.CurrencyRateLatest;
import com.aiasistan.model.FinanceMetalSymbol;
import com.aiasistan.repository.CurrencyRateLatestRepository;
import com.aiasistan.repository.CurrencyRateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class CurrencyService {
    private static final String MARKET_FX = "fx";
    private static final String MARKET_METALS = "metals";
    private static final List<String> SUPPORTED_FX_CODES = List.of(
        "USD", "EUR", "GBP", "TRY", "JPY", "CHF", "CAD", "AUD", "NZD",
        "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN",
        "CNY", "HKD", "SGD", "INR", "KRW", "MXN", "BRL", "ZAR", "SAR", "AED", "QAR", "KWD"
    );

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final FinanceMetalSymbolService financeMetalSymbolService;
    private final CurrencyRateRepository currencyRateRepository;
    private final CurrencyRateLatestRepository currencyRateLatestRepository;
    private final String currencyApiUrl;
    private final String currencyApiKey;
    private final String collectApiGoldUrl;
    private final String collectApiKey;
    private final int collectApiDailyRequestLimit;
    private final int collectApiMonthlyRequestLimit;
    private final String alphaVantageBaseUrl;
    private final String alphaVantageApiKey;
    private final int alphaVantageDailyRequestLimit;
    private final int historyRetentionDays;
    private final long updateIntervalMs;
    private final int retryMaxAttempts;
    private final long retryDelayMs;
    private final Map<String, Map<String, BigDecimal>> previousRateByBase = new ConcurrentHashMap<>();
    private final Map<String, List<CurrencyRateResponse>> cacheByBase = new ConcurrentHashMap<>();
    private final Map<String, Long> lastAlphaSyncByBase = new ConcurrentHashMap<>();
    private final Map<String, List<CurrencyRateResponse>> alphaCacheByBase = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> metalsTryCache = new ConcurrentHashMap<>();
    private OffsetDateTime metalsProviderTimestamp;
    private final AtomicInteger collectApiUsedRequestCount = new AtomicInteger(0);
    private LocalDate collectApiQuotaDate = LocalDate.now(ZoneOffset.UTC);
    private final AtomicInteger collectApiUsedRequestCountMonthly = new AtomicInteger(0);
    private YearMonth collectApiQuotaMonth = YearMonth.now(ZoneOffset.UTC);
    private final AtomicInteger alphaVantageUsedRequestCount = new AtomicInteger(0);
    private LocalDate alphaVantageQuotaDate = LocalDate.now(ZoneOffset.UTC);

    public CurrencyService(
        ObjectMapper objectMapper,
        FinanceMetalSymbolService financeMetalSymbolService,
        CurrencyRateRepository currencyRateRepository,
        CurrencyRateLatestRepository currencyRateLatestRepository,
        @Value("${finance.currency.api-url}") String currencyApiUrl,
        @Value("${finance.currency.api-key:}") String currencyApiKey,
        @Value("${finance.currency.metals.collectapi.url:https://api.collectapi.com/economy/goldPrice}") String collectApiGoldUrl,
        @Value("${finance.currency.metals.collectapi.api-key:}") String collectApiKey,
        @Value("${finance.currency.metals.collectapi.daily-request-limit:3}") int collectApiDailyRequestLimit,
        @Value("${finance.currency.metals.collectapi.monthly-request-limit:100}") int collectApiMonthlyRequestLimit,
        @Value("${finance.currency.alpha-vantage.base-url:https://www.alphavantage.co/query}") String alphaVantageBaseUrl,
        @Value("${finance.currency.alpha-vantage.api-key:}") String alphaVantageApiKey,
        @Value("${finance.currency.alpha-vantage.daily-request-limit:500}") int alphaVantageDailyRequestLimit,
        @Value("${finance.currency.history.retention-days:30}") int historyRetentionDays,
        @Value("${finance.currency.update-interval:3600000}") long updateIntervalMs,
        @Value("${finance.currency.retry.max-attempts:3}") int retryMaxAttempts,
        @Value("${finance.currency.retry.delay-ms:1000}") long retryDelayMs
    ) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
        this.financeMetalSymbolService = financeMetalSymbolService;
        this.currencyRateRepository = currencyRateRepository;
        this.currencyRateLatestRepository = currencyRateLatestRepository;
        this.currencyApiUrl = currencyApiUrl;
        this.currencyApiKey = currencyApiKey;
        this.collectApiGoldUrl = collectApiGoldUrl;
        this.collectApiKey = collectApiKey;
        this.collectApiDailyRequestLimit = collectApiDailyRequestLimit;
        this.collectApiMonthlyRequestLimit = collectApiMonthlyRequestLimit;
        this.alphaVantageBaseUrl = alphaVantageBaseUrl;
        this.alphaVantageApiKey = alphaVantageApiKey;
        this.alphaVantageDailyRequestLimit = alphaVantageDailyRequestLimit;
        this.historyRetentionDays = historyRetentionDays;
        this.updateIntervalMs = updateIntervalMs;
        this.retryMaxAttempts = retryMaxAttempts;
        this.retryDelayMs = retryDelayMs;
    }

    @Transactional
    public CurrencyRateResponse saveCurrencyRate(CurrencyRateRequest request) {
        throw new BadRequestException("Live mode aktif: kur verisi veritabanina kaydedilmez");
    }

    @Transactional
    public CurrencyRateResponse getLatestRate(String currencyCode) {
        return getLiveRate("TRY", currencyCode);
    }

    @Transactional
    public CurrencyRateResponse getLiveRate(String baseCurrency, String currencyCode) {
        String code = normalizeCurrency(currencyCode);
        List<CurrencyRateResponse> rates = getLiveRates(baseCurrency, List.of(code));
        if (rates.isEmpty()) {
            throw new BadRequestException("Canli kur bulunamadi: " + code);
        }
        return rates.get(0);
    }

    @Transactional
    public List<CurrencyRateResponse> getLiveRates(String baseCurrency, List<String> currencyCodes) {
        String base = normalizeCurrency(baseCurrency);
        List<String> requested = normalizeRequestedCurrencies(base, currencyCodes);

        try {
            List<CurrencyRateResponse> liveRates = fetchLiveRatesFromExternal(base, requested);
            if (liveRates.isEmpty()) {
                throw new BadRequestException("Canli kur verisi alinamadi");
            }
            List<CurrencyRateResponse> completedRates = completeWithDatabaseFallback(base, requested, liveRates, "Canli kur verisi eksik");
            cacheByBase.put(base, completedRates);
            return completedRates;
        } catch (Exception ex) {
            return getLatestRatesFromDatabaseOrThrow(base, requested, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<CurrencyRateResponse> getHistoricalRates(String currencyCode, LocalDateTime startDate, LocalDateTime endDate) {
        return getHistoricalRates(currencyCode, null, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<CurrencyRateResponse> getHistoricalRates(
        String currencyCode,
        String baseCurrency,
        LocalDateTime startDate,
        LocalDateTime endDate
    ) {
        String code = normalizeCurrency(currencyCode);
        String normalizedBase = (baseCurrency == null || baseCurrency.isBlank()) ? null : normalizeCurrency(baseCurrency);
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("startDate endDate'den buyuk olamaz");
        }
        LocalDateTime effectiveEnd = endDate != null ? endDate : LocalDateTime.now();
        LocalDateTime effectiveStart = startDate != null ? startDate : effectiveEnd.minusDays(1);
        List<CurrencyRate> rates = normalizedBase == null
            ? currencyRateRepository.findByCurrencyCodeAndRateDateBetweenOrderByRateDateDesc(code, effectiveStart, effectiveEnd)
            : currencyRateRepository.findByCurrencyCodeAndBaseCurrencyAndRateDateBetweenOrderByRateDateDesc(
                code,
                normalizedBase,
                effectiveStart,
                effectiveEnd
            );
        return rates
            .stream()
            .map(this::toResponseFromHistory)
            .toList();
    }

    @Transactional
    public PageResponse<CurrencyRateResponse> getAllRates(Pageable pageable) {
        List<CurrencyRateResponse> all = getLiveRates("TRY", getSupportedCurrencies());
        int start = (int) pageable.getOffset();
        if (start >= all.size()) {
            return PageResponse.of(new PageImpl<>(List.of(), pageable, all.size()));
        }
        int end = Math.min(start + pageable.getPageSize(), all.size());
        Page<CurrencyRateResponse> page = new PageImpl<>(all.subList(start, end), pageable, all.size());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<String> getSupportedCurrencies() {
        List<String> supported = new ArrayList<>(SUPPORTED_FX_CODES);
        supported.addAll(financeMetalSymbolService.getActiveCodes());
        return supported;
    }

    @Transactional(readOnly = true)
    public String normalizeSupportedCurrency(String code) {
        return normalizeCurrency(code);
    }

    @Transactional(readOnly = true)
    public long getEffectiveUpdateIntervalMs() {
        long minByQuota = getRecommendedIntervalByDailyLimitMs("TRY");
        long configured = updateIntervalMs > 0 ? updateIntervalMs : minByQuota;
        return Math.max(configured, minByQuota);
    }

    @Transactional(readOnly = true)
    public long getEffectiveUpdateIntervalMinutes() {
        return Math.max(1, Duration.ofMillis(getEffectiveUpdateIntervalMs()).toMinutes());
    }

    @Transactional(readOnly = true)
    public boolean canRunScheduledSync(String baseCurrency) {
        String base = normalizeCurrency(baseCurrency);
        return getRemainingDailyAlphaVantageQuota() >= getExternalRequestCountPerSync(base);
    }

    @Transactional(readOnly = true)
    public int getRemainingDailyAlphaVantageQuota() {
        synchronized (this) {
            rolloverQuotaDayIfRequired();
            return Math.max(0, alphaVantageDailyRequestLimit - alphaVantageUsedRequestCount.get());
        }
    }

    @Transactional
    public long cleanupHistoricalRates() {
        return 0;
    }

    @Transactional
    public List<CurrencyRateResponse> getLatestRatesByBase(String baseCurrency, List<String> currencyCodes, boolean refresh) {
        return getLiveRates(baseCurrency, currencyCodes);
    }

    @Transactional
    public List<CurrencyRateResponse> getAllLatestRates(String baseCurrency, boolean refresh) {
        return getLiveRates(baseCurrency, getSupportedCurrencies());
    }

    @Transactional
    public List<CurrencyRateResponse> getLiveRatesViaAlphaVantage(String baseCurrency, List<String> currencyCodes, boolean refresh) {
        String base = normalizeCurrency(baseCurrency);
        List<String> requested = normalizeRequestedCurrencies(base, currencyCodes);
        try {

            Long lastSync = lastAlphaSyncByBase.get(base);
            boolean shouldUseCache = !refresh
                && lastSync != null
                && (System.currentTimeMillis() - lastSync) < updateIntervalMs
                && alphaCacheByBase.containsKey(base);
            if (shouldUseCache) {
                return alphaCacheByBase.get(base);
            }

            if (alphaVantageApiKey == null || alphaVantageApiKey.isBlank()) {
                return getLatestRatesFromDatabaseOrThrow(base, requested, "AlphaVantage API key not configured");
            }

            int externalRequestCount = (int) requested.stream().filter(code -> !code.equals(base)).count();
            if (externalRequestCount > 0 && !tryConsumeAlphaVantageQuota(externalRequestCount)) {
                return getLatestRatesFromDatabaseOrThrow(base, requested, "Daily AlphaVantage quota exceeded");
            }

            Map<String, Integer> orderByCode = new LinkedHashMap<>();
            OffsetDateTime screenRefreshedAt = OffsetDateTime.now(ZoneOffset.UTC);
            for (int i = 0; i < requested.size(); i++) {
                orderByCode.putIfAbsent(requested.get(i), i);
            }

            List<CurrencyRateResponse> out = new ArrayList<>();
            boolean firstExternalCall = true;
            for (String code : requested) {
                if (code.equals(base)) {
                    OffsetDateTime nowTs = OffsetDateTime.now(ZoneOffset.UTC);
                    CurrencyRateResponse persisted = persistRateSnapshot(
                        code,
                        base,
                        BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP),
                        nowTs,
                        "alphavantage-live",
                        MARKET_FX,
                        screenRefreshedAt
                    );
                    out.add(persisted);
                    continue;
                }

                if (!firstExternalCall) {
                    sleepAlphaVantageBurstWindow();
                }
                firstExternalCall = false;

                String url = buildAlphaVantageUrl(code, base);
                ResponseEntity<String> response = fetchExternalWithRetry(url);
                try {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    if (root.has("Note")) {
                        throw new BadRequestException("AlphaVantage limit exceeded: " + root.path("Note").asText());
                    }
                    if (root.has("Information")) {
                        throw new BadRequestException("AlphaVantage information: " + root.path("Information").asText());
                    }
                    if (root.has("Error Message")) {
                        throw new BadRequestException("AlphaVantage error: " + root.path("Error Message").asText());
                    }

                    JsonNode fx = root.path("Realtime Currency Exchange Rate");
                    if (!fx.isObject()) {
                        throw new BadRequestException("Realtime Currency Exchange Rate missing");
                    }

                    String rateText = fx.path("5. Exchange Rate").asText(null);
                    if (rateText == null || rateText.isBlank()) {
                        throw new BadRequestException("Exchange rate missing");
                    }

                    BigDecimal rate = new BigDecimal(rateText).setScale(4, RoundingMode.HALF_UP);
                    OffsetDateTime providerTs = parseAlphaVantageTimestamp(fx.path("6. Last Refreshed").asText(null));

                    CurrencyRateResponse persisted = persistRateSnapshot(
                        code,
                        base,
                        rate,
                        providerTs,
                        "alphavantage-live",
                        MARKET_FX,
                        screenRefreshedAt
                    );
                    out.add(persisted);
                } catch (BadRequestException ex) {
                    throw ex;
                } catch (Exception ex) {
                    throw new BadRequestException("AlphaVantage parse failed: " + ex.getMessage());
                }
            }

            out.sort(Comparator.comparingInt(r -> orderByCode.getOrDefault(r.getCurrencyCode(), Integer.MAX_VALUE)));
            alphaCacheByBase.put(base, out);
            lastAlphaSyncByBase.put(base, System.currentTimeMillis());
            return out;
        } catch (Exception ex) {
            return getLatestRatesFromDatabaseOrThrow(base, requested, ex.getMessage());
        }
    }

    private void sleepAlphaVantageBurstWindow() {
        try {
            Thread.sleep(1200);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("AlphaVantage request interrupted");
        }
    }

    @Transactional
    public CurrencyPairDailyDetailResponse getCurrencyPairDailyDetail(String baseCurrency, String quoteCurrency) {
        String base = normalizeCurrency(baseCurrency);
        String quote = normalizeCurrency(quoteCurrency);
        if (base.equals(quote)) {
            throw new BadRequestException("Base and quote must be different");
        }
        if (alphaVantageApiKey == null || alphaVantageApiKey.isBlank()) {
            throw new BadRequestException("AlphaVantage API key not configured");
        }
        if (!tryConsumeAlphaVantageQuota(1)) {
            throw new BadRequestException("Daily AlphaVantage quota exceeded");
        }

        String url = buildAlphaVantageDailyUrl(base, quote);
        ResponseEntity<String> response = fetchExternalWithRetry(url);
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            if (root.has("Note")) {
                throw new BadRequestException("AlphaVantage limit exceeded: " + root.path("Note").asText());
            }
            if (root.has("Error Message")) {
                throw new BadRequestException("AlphaVantage error: " + root.path("Error Message").asText());
            }

            JsonNode series = root.path("Time Series FX (Daily)");
            if (!series.isObject() || series.isEmpty()) {
                throw new BadRequestException("No FX daily detail found");
            }

            Iterator<String> dates = series.fieldNames();
            String latestDate = dates.hasNext() ? dates.next() : null;
            if (latestDate == null) {
                throw new BadRequestException("No FX daily detail found");
            }
            JsonNode latest = series.path(latestDate);
            String prevDate = dates.hasNext() ? dates.next() : null;
            JsonNode prev = prevDate != null ? series.path(prevDate) : null;

            BigDecimal open = parseDailyPrice(latest, "1. open");
            BigDecimal high = parseDailyPrice(latest, "2. high");
            BigDecimal low = parseDailyPrice(latest, "3. low");
            BigDecimal close = parseDailyPrice(latest, "4. close");
            BigDecimal previousClose = prev != null ? parseDailyPrice(prev, "4. close") : null;

            BigDecimal change = null;
            BigDecimal changePercent = null;
            if (previousClose != null && previousClose.compareTo(BigDecimal.ZERO) != 0) {
                change = close.subtract(previousClose).setScale(6, RoundingMode.HALF_UP);
                changePercent = change.multiply(BigDecimal.valueOf(100)).divide(previousClose, 4, RoundingMode.HALF_UP);
            }

            CurrencyPairDailyDetailResponse out = new CurrencyPairDailyDetailResponse();
            out.setBaseCurrency(base);
            out.setQuoteCurrency(quote);
            out.setLatestTradingDay(LocalDate.parse(latestDate));
            out.setOpen(open);
            out.setHigh(high);
            out.setLow(low);
            out.setClose(close);
            out.setPreviousClose(previousClose);
            out.setChange(change);
            out.setChangePercent(changePercent);
            out.setProviderTimestamp(OffsetDateTime.now(ZoneOffset.UTC));
            out.setFetchedAt(OffsetDateTime.now(ZoneOffset.UTC));
            out.setSource("alphavantage-fx-daily");
            return out;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("FX daily detail parse failed: " + ex.getMessage());
        }
    }

    @Transactional
    public List<CurrencyRateResponse> fetchAndSaveLiveRates(String baseCurrency) {
        return getLiveRates(baseCurrency, getSupportedCurrencies());
    }

    @Transactional
    public List<CurrencyRateResponse> fetchAndSaveLiveRatesFromAlphaVantage(String baseCurrency) {
        return getLiveRates(baseCurrency, getSupportedCurrencies());
    }

    private List<CurrencyRateResponse> fetchLiveRatesFromExternal(String base, List<String> requested) {
        ResponseEntity<String> response = fetchExternalWithRetry(buildRatesUrl(base));
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode ratesNode = root.path("rates");
            if (!ratesNode.isObject()) {
                throw new BadRequestException("rates field missing");
            }

            OffsetDateTime providerTimestamp = extractProviderTimestamp(root);
            OffsetDateTime screenRefreshedAt = OffsetDateTime.now(ZoneOffset.UTC);
            var activeMetalCodes = financeMetalSymbolService.getActiveCodes();
            boolean requestedMetal = requested.stream().anyMatch(activeMetalCodes::contains);
            Map<String, BigDecimal> metalRatesTry = requestedMetal ? getLiveMetalRatesTry() : Map.of();
            BigDecimal tryPerBase = resolveTryPerBase(base, ratesNode);
            Map<String, Integer> orderByCode = new LinkedHashMap<>();
            for (int i = 0; i < requested.size(); i++) {
                orderByCode.putIfAbsent(requested.get(i), i);
            }
            List<CurrencyRateResponse> out = new ArrayList<>();

            for (String code : requested) {
                BigDecimal rate = resolveRate(base, code, ratesNode, metalRatesTry, tryPerBase);
                if (rate == null) {
                    continue;
                }

                boolean isMetal = activeMetalCodes.contains(code);
                OffsetDateTime effectiveProviderTs = isMetal && metalsProviderTimestamp != null
                    ? metalsProviderTimestamp
                    : providerTimestamp;
                String source = isMetal ? "collectapi-live" : "external-live";
                String market = isMetal ? MARKET_METALS : MARKET_FX;
                CurrencyRateResponse persisted = persistRateSnapshot(
                    code,
                    base,
                    rate,
                    effectiveProviderTs,
                    source,
                    market,
                    screenRefreshedAt
                );
                out.add(persisted);
            }

            out.sort(Comparator.comparingInt(r -> orderByCode.getOrDefault(r.getCurrencyCode(), Integer.MAX_VALUE)));
            return out;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Canli kur verisi parse edilemedi: " + ex.getMessage());
        }
    }

    @Transactional
    public void syncMetalsFromCollectApi() {
        getLiveMetalRatesTry();
    }

    @Transactional(readOnly = true)
    public int getRemainingDailyCollectApiQuota() {
        synchronized (this) {
            rolloverCollectApiQuotaDayIfRequired();
            return Math.max(0, collectApiDailyRequestLimit - collectApiUsedRequestCount.get());
        }
    }

    private CurrencyRateResponse persistRateSnapshot(
        String currencyCode,
        String baseCurrency,
        BigDecimal rate,
        OffsetDateTime providerTimestamp,
        String source,
        String market,
        OffsetDateTime screenRefreshedAt
    ) {
        LocalDateTime dbRecordedAt = LocalDateTime.now();
        BigDecimal changeRate = resolveChangeRateFromHistory(baseCurrency, currencyCode, market, source, rate);

        CurrencyRateLatest latest = currencyRateLatestRepository
            .findByBaseCurrencyAndCurrencyCodeAndMarket(baseCurrency, currencyCode, market)
            .orElseGet(CurrencyRateLatest::new);
        latest.setCurrencyCode(currencyCode);
        latest.setBaseCurrency(baseCurrency);
        latest.setMarket(market);
        latest.setRate(rate);
        latest.setChangeRate(changeRate);
        latest.setProviderTimestamp(providerTimestamp);
        latest.setRateDate(dbRecordedAt);
        latest.setSource(source);
        CurrencyRateLatest savedLatest = currencyRateLatestRepository.save(latest);

        CurrencyRate history = new CurrencyRate();
        history.setCurrencyCode(currencyCode);
        history.setBaseCurrency(baseCurrency);
        history.setMarket(market);
        history.setRate(rate);
        history.setChangeRate(changeRate);
        history.setProviderTimestamp(providerTimestamp);
        history.setRateDate(dbRecordedAt);
        history.setSource(source);
        currencyRateRepository.save(history);

        return toResponse(
            savedLatest.getId(),
            currencyCode,
            baseCurrency,
            rate,
            changeRate,
            providerTimestamp,
            dbRecordedAt,
            source,
            screenRefreshedAt,
            dbRecordedAt
        );
    }

    private BigDecimal resolveChangeRateFromHistory(
        String baseCurrency,
        String currencyCode,
        String market,
        String source,
        BigDecimal currentRate
    ) {
        return currencyRateRepository
            .findTopByCurrencyCodeAndBaseCurrencyAndMarketAndSourceOrderByRateDateDesc(
                currencyCode,
                baseCurrency,
                market,
                source
            )
            .map(CurrencyRate::getRate)
            .map(previous -> currentRate.subtract(previous).setScale(4, RoundingMode.HALF_UP))
            .orElse(null);
    }

    private CurrencyRateResponse toResponseFromHistory(CurrencyRate rate) {
        OffsetDateTime screenRefreshedAt = OffsetDateTime.now(ZoneOffset.UTC);
        return toResponse(
            rate.getId(),
            rate.getCurrencyCode(),
            rate.getBaseCurrency(),
            rate.getRate(),
            rate.getChangeRate(),
            rate.getProviderTimestamp(),
            rate.getRateDate(),
            rate.getSource(),
            screenRefreshedAt,
            rate.getRateDate()
        );
    }

    private CurrencyRateResponse toResponseFromLatest(CurrencyRateLatest latest, OffsetDateTime screenRefreshedAt) {
        String fallbackSource = (latest.getSource() == null || latest.getSource().isBlank())
            ? "db-fallback"
            : latest.getSource() + "-db-fallback";
        return toResponse(
            latest.getId(),
            latest.getCurrencyCode(),
            latest.getBaseCurrency(),
            latest.getRate(),
            latest.getChangeRate(),
            latest.getProviderTimestamp(),
            latest.getRateDate(),
            fallbackSource,
            screenRefreshedAt,
            latest.getRateDate()
        );
    }

    private CurrencyRateResponse toResponse(
        UUID id,
        String currencyCode,
        String baseCurrency,
        BigDecimal rate,
        BigDecimal changeRate,
        OffsetDateTime providerTimestamp,
        LocalDateTime rateDate,
        String source,
        OffsetDateTime screenRefreshedAt,
        LocalDateTime dbRecordedAt
    ) {
        String code = normalizeCurrency(currencyCode);
        OffsetDateTime lastUpdated = screenRefreshedAt != null
            ? screenRefreshedAt
            : OffsetDateTime.now(ZoneOffset.UTC);

        BigDecimal changePercent = null;
        if (rate != null && changeRate != null) {
            BigDecimal previous = rate.subtract(changeRate);
            if (previous.compareTo(BigDecimal.ZERO) != 0) {
                changePercent = changeRate.multiply(BigDecimal.valueOf(100)).divide(previous, 4, RoundingMode.HALF_UP);
            }
        }

        return CurrencyRateResponse.builder()
            .id(id)
            .currencyCode(code)
            .currencyName(getCurrencyDisplayName(code))
            .rate(rate)
            .changeRate(changeRate)
            .changePercent(changePercent)
            .baseCurrency(baseCurrency != null ? normalizeCurrency(baseCurrency) : null)
            .providerTimestamp(providerTimestamp)
            .rateDate(rateDate)
            .lastUpdatedAt(lastUpdated)
            .dbRecordedAt(dbRecordedAt)
            .screenRefreshedAt(screenRefreshedAt)
            .source(source)
            .build();
    }

    private String buildRatesUrl(String baseCurrency) {
        String normalized = currencyApiUrl.endsWith("/") ? currencyApiUrl : currencyApiUrl + "/";
        String url = normalized + baseCurrency;
        if (currencyApiKey != null && !currencyApiKey.isBlank()) {
            String delimiter = url.contains("?") ? "&" : "?";
            url = url + delimiter + "apikey=" + currencyApiKey;
        }
        return url;
    }

    private String buildAlphaVantageUrl(String fromCurrency, String toCurrency) {
        return alphaVantageBaseUrl
            + "?function=CURRENCY_EXCHANGE_RATE"
            + "&from_currency=" + fromCurrency
            + "&to_currency=" + toCurrency
            + "&apikey=" + alphaVantageApiKey;
    }

    private String buildAlphaVantageDailyUrl(String baseCurrency, String quoteCurrency) {
        return alphaVantageBaseUrl
            + "?function=FX_DAILY"
            + "&from_symbol=" + baseCurrency
            + "&to_symbol=" + quoteCurrency
            + "&outputsize=compact"
            + "&apikey=" + alphaVantageApiKey;
    }

    private BigDecimal resolveRate(
        String base,
        String code,
        JsonNode ratesNode,
        Map<String, BigDecimal> metalRatesTry,
        BigDecimal tryPerBase
    ) {
        if (code.equals(base)) {
            return BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP);
        }
        if (financeMetalSymbolService.isActiveMetalCode(code)) {
            BigDecimal metalTry = metalRatesTry.get(code);
            if (metalTry == null) {
                return null;
            }
            if ("TRY".equals(base)) {
                return metalTry.setScale(4, RoundingMode.HALF_UP);
            }
            if (tryPerBase == null || tryPerBase.compareTo(BigDecimal.ZERO) == 0) {
                return null;
            }
            return metalTry.divide(tryPerBase, 8, RoundingMode.HALF_UP).setScale(4, RoundingMode.HALF_UP);
        }
        JsonNode rateNode = ratesNode.get(code);
        if (rateNode == null || !rateNode.isNumber()) {
            return null;
        }
        BigDecimal quotePerBase = rateNode.decimalValue();
        if (quotePerBase.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return BigDecimal.ONE.divide(quotePerBase, 8, RoundingMode.HALF_UP).setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveTryPerBase(String base, JsonNode ratesNode) {
        if ("TRY".equals(base)) {
            return BigDecimal.ONE.setScale(8, RoundingMode.HALF_UP);
        }
        JsonNode baseNode = ratesNode.get(base);
        if (baseNode == null || !baseNode.isNumber()) {
            return null;
        }
        BigDecimal basePerTry = baseNode.decimalValue();
        if (basePerTry.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return BigDecimal.ONE.divide(basePerTry, 8, RoundingMode.HALF_UP);
    }

    private Map<String, BigDecimal> getLiveMetalRatesTry() {
        Map<String, BigDecimal> fresh = tryFetchMetalRatesTryFromCollectApi();
        if (!fresh.isEmpty()) {
            metalsTryCache.clear();
            metalsTryCache.putAll(fresh);
            return fresh;
        }
        if (!metalsTryCache.isEmpty()) {
            return new HashMap<>(metalsTryCache);
        }
        return Map.of();
    }

    private Map<String, BigDecimal> tryFetchMetalRatesTryFromCollectApi() {
        if (collectApiKey == null || collectApiKey.isBlank() || collectApiGoldUrl == null || collectApiGoldUrl.isBlank()) {
            return Map.of();
        }
        if (!tryConsumeCollectApiQuota(1)) {
            return Map.of();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", "apikey " + collectApiKey);
            headers.set("content-type", "application/json");

            ResponseEntity<String> response = restTemplate.exchange(
                collectApiGoldUrl,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return Map.of();
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode result = root.path("result");
            if (!result.isArray()) {
                return Map.of();
            }

            Map<String, FinanceMetalSymbol> collectApiNameIndex = financeMetalSymbolService.getCollectApiNameIndex();
            Map<String, BigDecimal> metals = new HashMap<>();
            for (JsonNode item : result) {
                String rawName = item.path("name").asText("");
                String normalizedName = financeMetalSymbolService.normalizeCollectApiName(rawName);
                BigDecimal price = extractMetalPrice(item);
                if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                FinanceMetalSymbol symbol = collectApiNameIndex.get(normalizedName);
                if (symbol != null) {
                    metals.putIfAbsent(symbol.getCode(), price.setScale(4, RoundingMode.HALF_UP));
                }
            }

            if (!metals.isEmpty()) {
                metalsProviderTimestamp = OffsetDateTime.now(ZoneOffset.UTC);
            }
            return metals;
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private BigDecimal extractMetalPrice(JsonNode item) {
        BigDecimal selling = parsePriceNode(item.path("sell"));
        if (selling == null) {
            selling = parsePriceNode(item.path("selling"));
        }
        if (selling != null) {
            return selling;
        }
        BigDecimal buy = parsePriceNode(item.path("buy"));
        if (buy == null) {
            buy = parsePriceNode(item.path("buying"));
        }
        if (buy != null) {
            return buy;
        }
        return parsePriceNode(item.path("rate"));
    }

    private BigDecimal parsePriceNode(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.decimalValue();
        }
        if (!node.isTextual()) {
            return null;
        }
        String raw = node.asText("").trim();
        if (raw.isBlank()) {
            return null;
        }
        String normalized = raw.replace(".", "").replace(",", ".");
        try {
            return new BigDecimal(normalized);
        } catch (Exception ex) {
            return null;
        }
    }

    private List<String> normalizeRequestedCurrencies(String base, List<String> currencyCodes) {
        List<String> requested = (currencyCodes == null || currencyCodes.isEmpty())
            ? getSupportedCurrencies()
            : currencyCodes.stream().map(this::normalizeCurrency).distinct().toList();
        if (requested.contains(base)) {
            return requested;
        }
        List<String> withBase = new ArrayList<>(requested);
        withBase.add(base);
        return withBase;
    }

    private List<CurrencyRateResponse> getLatestRatesFromDatabaseOrThrow(
        String baseCurrency,
        List<String> requestedCodes,
        String reason
    ) {
        List<CurrencyRateLatest> latestRows = getLatestRowsFromDatabase(baseCurrency);
        if (latestRows.isEmpty()) {
            throw new BadRequestException("Canli kur bulunamadi ve veritabaninda kayit yok: " + reason);
        }

        Map<String, CurrencyRateLatest> latestByCode = latestRows.stream()
            .collect(Collectors.toMap(
                row -> normalizeCurrency(row.getCurrencyCode()),
                row -> row,
                (first, second) -> first,
                LinkedHashMap::new
            ));

        OffsetDateTime screenRefreshedAt = OffsetDateTime.now(ZoneOffset.UTC);
        List<String> order = (requestedCodes == null || requestedCodes.isEmpty())
            ? latestRows.stream().map(CurrencyRateLatest::getCurrencyCode).toList()
            : requestedCodes;

        List<CurrencyRateResponse> out = new ArrayList<>();
        for (String code : order) {
            CurrencyRateLatest latest = latestByCode.get(normalizeCurrency(code));
            if (latest != null) {
                out.add(toResponseFromLatest(latest, screenRefreshedAt));
            }
        }

        if (out.isEmpty()) {
            throw new BadRequestException("Istenen semboller icin veritabaninda son kur kaydi yok: " + reason);
        }
        return out;
    }

    private List<CurrencyRateResponse> completeWithDatabaseFallback(
        String baseCurrency,
        List<String> requestedCodes,
        List<CurrencyRateResponse> liveRates,
        String reason
    ) {
        Map<String, CurrencyRateResponse> liveByCode = liveRates.stream()
            .collect(Collectors.toMap(
                r -> normalizeCurrency(r.getCurrencyCode()),
                r -> r,
                (first, second) -> first,
                LinkedHashMap::new
            ));

        boolean allPresent = requestedCodes.stream().allMatch(code -> liveByCode.containsKey(normalizeCurrency(code)));
        if (allPresent) {
            return requestedCodes.stream()
                .map(code -> liveByCode.get(normalizeCurrency(code)))
                .toList();
        }

        Map<String, CurrencyRateResponse> dbByCode = getLatestRowsFromDatabase(baseCurrency).stream()
            .collect(Collectors.toMap(
                row -> normalizeCurrency(row.getCurrencyCode()),
                row -> toResponseFromLatest(row, OffsetDateTime.now(ZoneOffset.UTC)),
                (first, second) -> first,
                LinkedHashMap::new
            ));

        List<CurrencyRateResponse> out = new ArrayList<>();
        Set<String> missing = new HashSet<>();
        for (String code : requestedCodes) {
            String normalizedCode = normalizeCurrency(code);
            CurrencyRateResponse value = liveByCode.get(normalizedCode);
            if (value == null) {
                value = dbByCode.get(normalizedCode);
            }
            if (value == null && !normalizedCode.equals(baseCurrency)) {
                missing.add(normalizedCode);
                continue;
            }
            if (value != null) {
                out.add(value);
            }
        }

        if (!missing.isEmpty()) {
            throw new BadRequestException("Istenen semboller icin canli/veritabani kaydi yok: " + String.join(", ", missing) + ". " + reason);
        }
        return out;
    }

    private List<CurrencyRateLatest> getLatestRowsFromDatabase(String baseCurrency) {
        List<CurrencyRateLatest> latestRows = currencyRateLatestRepository.findByBaseCurrencyOrderByCurrencyCodeAsc(baseCurrency);
        return latestRows != null ? latestRows : List.of();
    }

    private String normalizeCurrency(String code) {
        if (code == null || code.isBlank()) {
            return "TRY";
        }
        String normalized = code.trim().toUpperCase();
        if (!SUPPORTED_FX_CODES.contains(normalized) && !financeMetalSymbolService.isActiveMetalCode(normalized)) {
            throw new BadRequestException("Desteklenmeyen para birimi: " + normalized);
        }
        return normalized;
    }

    private String getCurrencyDisplayName(String code) {
        String fxName = switch (code) {
            case "USD" -> "Amerikan Dolari";
            case "EUR" -> "Euro";
            case "GBP" -> "Ingiliz Sterlini";
            case "TRY" -> "Turk Lirasi";
            case "JPY" -> "Japon Yeni";
            case "CHF" -> "Isvicre Frangi";
            case "CAD" -> "Kanada Dolari";
            case "AUD" -> "Avustralya Dolari";
            case "NZD" -> "Yeni Zelanda Dolari";
            case "SEK" -> "Isvec Kronu";
            case "NOK" -> "Norvec Kronu";
            case "DKK" -> "Danimarka Kronu";
            case "PLN" -> "Polonya Zlotisi";
            case "CZK" -> "Cek Korunasi";
            case "HUF" -> "Macar Forinti";
            case "RON" -> "Romanya Leyi";
            case "BGN" -> "Bulgar Levi";
            case "CNY" -> "Cin Yuani";
            case "HKD" -> "Hong Kong Dolari";
            case "SGD" -> "Singapur Dolari";
            case "INR" -> "Hindistan Rupisi";
            case "KRW" -> "Guney Kore Wonu";
            case "MXN" -> "Meksika Pesosu";
            case "BRL" -> "Brezilya Reali";
            case "ZAR" -> "Guney Afrika Randi";
            case "SAR" -> "Suudi Riyali";
            case "AED" -> "BAE Dirhemi";
            case "QAR" -> "Katar Riyali";
            case "KWD" -> "Kuveyt Dinari";
            default -> null;
        };
        if (fxName != null) {
            return fxName;
        }
        return financeMetalSymbolService.getActiveSymbols().stream()
            .filter(s -> s.getCode().equalsIgnoreCase(code))
            .map(FinanceMetalSymbol::getDisplayName)
            .findFirst()
            .orElse(code);
    }

    private ResponseEntity<String> fetchExternalWithRetry(String url) {
        RestClientException lastException = null;

        for (int attempt = 1; attempt <= retryMaxAttempts; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return response;
                }
            } catch (RestClientException ex) {
                lastException = ex;
            }

            if (attempt < retryMaxAttempts && retryDelayMs > 0) {
                try {
                    Thread.sleep(retryDelayMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new BadRequestException("Rate retry interrupted");
                }
            }
        }

        if (lastException != null) {
            throw new BadRequestException("Rate provider not reachable: " + lastException.getMessage());
        }
        throw new BadRequestException("Rate provider failed");
    }

    private OffsetDateTime extractProviderTimestamp(JsonNode root) {
        JsonNode unixNode = root.path("time_last_update_unix");
        if (unixNode.isIntegralNumber()) {
            return OffsetDateTime.ofInstant(Instant.ofEpochSecond(unixNode.asLong()), ZoneOffset.UTC);
        }
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    private OffsetDateTime parseAlphaVantageTimestamp(String value) {
        if (value == null || value.isBlank()) {
            return OffsetDateTime.now(ZoneOffset.UTC);
        }
        try {
            LocalDateTime dt = LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            return dt.atOffset(ZoneOffset.UTC);
        } catch (DateTimeParseException ex) {
            return OffsetDateTime.now(ZoneOffset.UTC);
        }
    }

    private BigDecimal parseDailyPrice(JsonNode node, String field) {
        String text = node.path(field).asText(null);
        if (text == null || text.isBlank()) {
            throw new BadRequestException("Missing field: " + field);
        }
        return new BigDecimal(text).setScale(6, RoundingMode.HALF_UP);
    }

    private long getRecommendedIntervalByDailyLimitMs(String baseCurrency) {
        int reqCount = Math.max(1, getExternalRequestCountPerSync(baseCurrency));
        if (alphaVantageDailyRequestLimit <= 0) {
            return updateIntervalMs > 0 ? updateIntervalMs : 3600000L;
        }
        return Math.max(60000L, (long) Math.ceil((86400000d * reqCount) / alphaVantageDailyRequestLimit));
    }

    private int getExternalRequestCountPerSync(String baseCurrency) {
        int count = 0;
        for (String code : SUPPORTED_FX_CODES) {
            if (!code.equals(baseCurrency)) {
                count++;
            }
        }
        return Math.max(1, count);
    }

    private boolean tryConsumeAlphaVantageQuota(int requestCount) {
        synchronized (this) {
            rolloverQuotaDayIfRequired();
            int used = alphaVantageUsedRequestCount.get();
            if (used + requestCount > alphaVantageDailyRequestLimit) {
                return false;
            }
            alphaVantageUsedRequestCount.addAndGet(requestCount);
            return true;
        }
    }

    private void rolloverQuotaDayIfRequired() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!today.equals(alphaVantageQuotaDate)) {
            alphaVantageQuotaDate = today;
            alphaVantageUsedRequestCount.set(0);
        }
    }

    private boolean tryConsumeCollectApiQuota(int requestCount) {
        synchronized (this) {
            rolloverCollectApiQuotaDayIfRequired();
            rolloverCollectApiQuotaMonthIfRequired();
            int used = collectApiUsedRequestCount.get();
            if (used + requestCount > collectApiDailyRequestLimit) {
                return false;
            }
            int usedMonthly = collectApiUsedRequestCountMonthly.get();
            if (usedMonthly + requestCount > collectApiMonthlyRequestLimit) {
                return false;
            }
            collectApiUsedRequestCount.addAndGet(requestCount);
            collectApiUsedRequestCountMonthly.addAndGet(requestCount);
            return true;
        }
    }

    private void rolloverCollectApiQuotaDayIfRequired() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!today.equals(collectApiQuotaDate)) {
            collectApiQuotaDate = today;
            collectApiUsedRequestCount.set(0);
        }
    }

    private void rolloverCollectApiQuotaMonthIfRequired() {
        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        if (!currentMonth.equals(collectApiQuotaMonth)) {
            collectApiQuotaMonth = currentMonth;
            collectApiUsedRequestCountMonthly.set(0);
        }
    }
}