package com.aiasistan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aiasistan.dto.request.CurrencyRateRequest;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.CurrencyCode;
import com.aiasistan.model.CurrencyRate;
import com.aiasistan.repository.CurrencyRateRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class CurrencyService {
    
    private final CurrencyRateRepository currencyRateRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String currencyApiUrl;
    private final String currencyApiKey;
    private final long updateIntervalMs;
    private final int retryMaxAttempts;
    private final long retryDelayMs;
    private final Map<String, Long> lastSyncByBase = new ConcurrentHashMap<>();
    private final Map<String, List<CurrencyRateResponse>> cacheByBase = new ConcurrentHashMap<>();

    public CurrencyService(
        CurrencyRateRepository currencyRateRepository,
        ObjectMapper objectMapper,
        @Value("${finance.currency.api-url}") String currencyApiUrl,
        @Value("${finance.currency.api-key:}") String currencyApiKey,
        @Value("${finance.currency.update-interval:3600000}") long updateIntervalMs,
        @Value("${finance.currency.retry.max-attempts:3}") int retryMaxAttempts,
        @Value("${finance.currency.retry.delay-ms:1000}") long retryDelayMs
    ) {
        this.currencyRateRepository = currencyRateRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
        this.currencyApiUrl = currencyApiUrl;
        this.currencyApiKey = currencyApiKey;
        this.updateIntervalMs = updateIntervalMs;
        this.retryMaxAttempts = retryMaxAttempts;
        this.retryDelayMs = retryDelayMs;
    }
    
    @Transactional
    public CurrencyRateResponse saveCurrencyRate(CurrencyRateRequest request) {
        CurrencyCode currencyCode = CurrencyCode.fromString(request.getCurrencyCode());
        
        CurrencyRate currencyRate = new CurrencyRate();
        currencyRate.setCurrencyCode(currencyCode);
        currencyRate.setBaseCurrency(CurrencyCode.fromString(request.getBaseCurrency()));
        currencyRate.setRate(request.getRate());
        currencyRate.setChangeRate(request.getChangeRate());
        currencyRate.setProviderTimestamp(request.getProviderTimestamp());
        currencyRate.setRateDate(LocalDateTime.now());
        currencyRate.setSource(request.getSource());
        
        CurrencyRate saved = currencyRateRepository.save(currencyRate);
        return mapToResponse(saved);
    }
    
    @Transactional(readOnly = true)
    public CurrencyRateResponse getLatestRate(String currencyCode) {
        CurrencyCode code = CurrencyCode.fromString(currencyCode);
        CurrencyRate rate = currencyRateRepository
            .findTopByCurrencyCodeOrderByRateDateDesc(code)
            .orElseThrow(() -> new NotFoundException("Currency rate not found for: " + currencyCode));
        return mapToResponse(rate);
    }
    
    @Transactional(readOnly = true)
    public List<CurrencyRateResponse> getHistoricalRates(String currencyCode, LocalDateTime startDate, LocalDateTime endDate) {
        CurrencyCode code = CurrencyCode.fromString(currencyCode);
        return currencyRateRepository
            .findByCurrencyCodeAndRateDateBetweenOrderByRateDateDesc(code, startDate, endDate)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<CurrencyRateResponse> getAllRates(Pageable pageable) {
        return currencyRateRepository.findAllByOrderByRateDateDesc(pageable)
            .map(this::mapToResponse);
    }

    @Transactional
    public List<CurrencyRateResponse> fetchAndSaveLiveRates(String baseCurrency) {
        CurrencyCode base = CurrencyCode.fromString(baseCurrency);
        String baseKey = base.name();

        if (isRateLimited(baseKey)) {
            return getCachedRates(base);
        }

        String url = buildRatesUrl(base.name());
        ResponseEntity<String> response = fetchExternalWithRetry(url);

        OffsetDateTime providerTimestamp = null;
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode ratesNode = root.path("rates");
            if (!ratesNode.isObject()) {
                throw new BadRequestException("Kur cevabinda rates alani yok");
            }
            providerTimestamp = extractProviderTimestamp(root);

            List<CurrencyRateResponse> savedRates = new ArrayList<>();
            for (CurrencyCode code : CurrencyCode.values()) {
                JsonNode rateNode = ratesNode.get(code.name());
                if (rateNode == null || !rateNode.isNumber()) {
                    continue;
                }

                BigDecimal latestRate = rateNode.decimalValue().setScale(4, RoundingMode.HALF_UP);
                BigDecimal changeRate = currencyRateRepository
                    .findTopByCurrencyCodeAndBaseCurrencyOrderByRateDateDesc(code, base)
                    .map(prev -> latestRate.subtract(prev.getRate()))
                    .orElse(null);

                CurrencyRate currencyRate = new CurrencyRate();
                currencyRate.setCurrencyCode(code);
                currencyRate.setBaseCurrency(base);
                currencyRate.setRate(latestRate);
                currencyRate.setChangeRate(changeRate);
                currencyRate.setProviderTimestamp(providerTimestamp);
                currencyRate.setRateDate(LocalDateTime.now());
                currencyRate.setSource("external-api");

                CurrencyRate saved = currencyRateRepository.save(currencyRate);
                savedRates.add(mapToResponse(saved));
            }

            if (savedRates.isEmpty()) {
                throw new BadRequestException("Kur servisinden desteklenen para birimi donmedi");
            }
            lastSyncByBase.put(baseKey, System.currentTimeMillis());
            cacheByBase.put(baseKey, savedRates);
            return savedRates;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Kur cevabi parse edilemedi: " + ex.getMessage());
        }
    }
    
    private CurrencyRateResponse mapToResponse(CurrencyRate rate) {
        return CurrencyRateResponse.builder()
            .id(rate.getId())
            .currencyCode(rate.getCurrencyCode().name())
            .currencyName(rate.getCurrencyCode().getDisplayName())
            .rate(rate.getRate())
            .changeRate(rate.getChangeRate())
            .baseCurrency(rate.getBaseCurrency() != null ? rate.getBaseCurrency().name() : null)
            .providerTimestamp(rate.getProviderTimestamp())
            .rateDate(rate.getRateDate())
            .source(rate.getSource())
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

    private boolean isRateLimited(String baseCurrency) {
        Long lastSync = lastSyncByBase.get(baseCurrency);
        if (lastSync == null) {
            return false;
        }
        long elapsed = System.currentTimeMillis() - lastSync;
        return elapsed < updateIntervalMs;
    }

    private List<CurrencyRateResponse> getCachedRates(CurrencyCode baseCurrency) {
        String key = baseCurrency.name();
        List<CurrencyRateResponse> cached = cacheByBase.get(key);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

        Map<CurrencyCode, CurrencyRate> latestByCode = new LinkedHashMap<>();
        for (CurrencyRate rate : currencyRateRepository.findByBaseCurrencyOrderByRateDateDesc(baseCurrency)) {
            latestByCode.putIfAbsent(rate.getCurrencyCode(), rate);
        }
        if (latestByCode.isEmpty()) {
            throw new BadRequestException("Cache aktif ama tabanda uygun kur verisi bulunamadi");
        }

        List<CurrencyRateResponse> fallback = latestByCode.values()
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        cacheByBase.put(key, fallback);
        return fallback;
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
                    throw new BadRequestException("Kur istegi retry sirasinda kesildi");
                }
            }
        }

        if (lastException != null) {
            throw new BadRequestException("Kur servisine erisim saglanamadi: " + lastException.getMessage());
        }
        throw new BadRequestException("Kur servisi basarisiz cevap dondu");
    }

    private OffsetDateTime extractProviderTimestamp(JsonNode root) {
        JsonNode unixNode = root.path("time_last_update_unix");
        if (unixNode.isIntegralNumber()) {
            return OffsetDateTime.ofInstant(Instant.ofEpochSecond(unixNode.asLong()), ZoneOffset.UTC);
        }
        return OffsetDateTime.now(ZoneOffset.UTC);
    }
}
