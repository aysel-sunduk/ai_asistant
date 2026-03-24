package com.aiasistan.service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import com.aiasistan.dto.GoogleCalendarDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.model.FamilyBirthday;
import com.aiasistan.model.Reminder;
import com.aiasistan.model.UserGoogleCalendarToken;
import com.aiasistan.model.WorkEvent;
import com.aiasistan.repository.FamilyBirthdayRepository;
import com.aiasistan.repository.ReminderRepository;
import com.aiasistan.repository.UserGoogleCalendarTokenRepository;
import com.aiasistan.repository.WorkEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GoogleCalendarService {
    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarService.class);
    private static final String DEFAULT_SCOPE = "https://www.googleapis.com/auth/calendar.events";
    private static final String DEFAULT_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String DEFAULT_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String DEFAULT_API_BASE = "https://www.googleapis.com/calendar/v3";

    private final UserService userService;
    private final UserGoogleCalendarTokenRepository tokenRepository;
    private final ReminderRepository reminderRepository;
    private final WorkEventRepository workEventRepository;
    private final FamilyBirthdayRepository familyBirthdayRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String credentialsFilePath;
    private final String calendarId;
    private final String apiBaseUrl;
    private final String scope;
    private volatile GoogleClientConfig cachedClientConfig;

    public GoogleCalendarService(
            UserService userService,
            UserGoogleCalendarTokenRepository tokenRepository,
            ReminderRepository reminderRepository,
            WorkEventRepository workEventRepository,
            FamilyBirthdayRepository familyBirthdayRepository,
            ObjectMapper objectMapper,
            @Value("${app.google.calendar.enabled:false}") boolean enabled,
            @Value("${app.google.calendar.credentials-file:}") String credentialsFilePath,
            @Value("${app.google.calendar.calendar-id:primary}") String calendarId,
            @Value("${app.google.calendar.scope:" + DEFAULT_SCOPE + "}") String scope,
            @Value("${app.google.calendar.api-base-url:" + DEFAULT_API_BASE + "}") String apiBaseUrl) {
        this.userService = userService;
        this.tokenRepository = tokenRepository;
        this.reminderRepository = reminderRepository;
        this.workEventRepository = workEventRepository;
        this.familyBirthdayRepository = familyBirthdayRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
        this.enabled = enabled;
        this.credentialsFilePath = credentialsFilePath;
        this.calendarId = calendarId;
        this.scope = scope;
        this.apiBaseUrl = apiBaseUrl;
    }

    @Transactional(readOnly = true)
    public GoogleCalendarDto.AuthUrlResponse buildAuthUrl(String userEmail, String redirectUri) {
        userService.getUserIdByEmail(userEmail);
        ensureEnabled();
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new BadRequestException("redirectUri zorunludur");
        }
        GoogleClientConfig cfg = loadClientConfig();
        String authUrl = cfg.authUri + "?client_id=" + enc(cfg.clientId)
                + "&redirect_uri=" + enc(redirectUri.trim())
                + "&response_type=code"
                + "&scope=" + enc(scope)
                + "&access_type=offline"
                + "&prompt=consent"
                + "&include_granted_scopes=true";
        GoogleCalendarDto.AuthUrlResponse response = new GoogleCalendarDto.AuthUrlResponse();
        response.setAuthUrl(authUrl);
        return response;
    }

    @Transactional
    public GoogleCalendarDto.StatusResponse connect(String userEmail, GoogleCalendarDto.ConnectRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ensureEnabled();
        GoogleClientConfig cfg = loadClientConfig();
        Map<String, Object> tokenResult = exchangeAuthCode(cfg, request.getCode().trim(), request.getRedirectUri().trim());

        String accessToken = textOrNull(tokenResult.get("access_token"));
        if (accessToken == null || accessToken.isBlank()) {
            throw new BadRequestException("Google access token alinamadi");
        }

        UserGoogleCalendarToken token = tokenRepository.findByUserId(userId).orElseGet(UserGoogleCalendarToken::new);
        token.setUserId(userId);
        token.setAccessToken(accessToken);
        String refreshToken = textOrNull(tokenResult.get("refresh_token"));
        if (refreshToken != null && !refreshToken.isBlank()) {
            token.setRefreshToken(refreshToken);
        }
        token.setTokenType(textOrNull(tokenResult.get("token_type")));
        token.setScope(textOrNull(tokenResult.get("scope")));
        token.setExpiresAt(extractExpiry(tokenResult.get("expires_in")));
        if (token.getSelectedCalendarId() == null || token.getSelectedCalendarId().isBlank()) {
            token.setSelectedCalendarId(calendarId);
            token.setSelectedCalendarSummary("Primary");
        }
        token.setDeletedAt(null);
        UserGoogleCalendarToken saved = tokenRepository.save(token);

        GoogleCalendarDto.StatusResponse response = new GoogleCalendarDto.StatusResponse();
        response.setConnected(true);
        response.setConnectedAt(saved.getCreatedAt() == null ? null : saved.getCreatedAt().toString());
        response.setExpiresAt(saved.getExpiresAt() == null ? null : saved.getExpiresAt().toString());
        response.setSelectedCalendarId(saved.getSelectedCalendarId());
        response.setSelectedCalendarSummary(saved.getSelectedCalendarSummary());
        return response;
    }

    @Transactional(readOnly = true)
    public GoogleCalendarDto.StatusResponse getStatus(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Optional<UserGoogleCalendarToken> maybe = tokenRepository.findByUserId(userId);
        GoogleCalendarDto.StatusResponse response = new GoogleCalendarDto.StatusResponse();
        response.setConnected(maybe.isPresent());
        response.setConnectedAt(maybe.map(UserGoogleCalendarToken::getCreatedAt).map(OffsetDateTime::toString).orElse(null));
        response.setExpiresAt(maybe.map(UserGoogleCalendarToken::getExpiresAt).map(OffsetDateTime::toString).orElse(null));
        response.setSelectedCalendarId(maybe.map(UserGoogleCalendarToken::getSelectedCalendarId).orElse(null));
        response.setSelectedCalendarSummary(maybe.map(UserGoogleCalendarToken::getSelectedCalendarSummary).orElse(null));
        return response;
    }

    @Transactional(readOnly = true)
    public List<GoogleCalendarDto.CalendarItem> listCalendars(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ensureEnabled();
        UserGoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Google Calendar baglantisi bulunamadi"));
        String accessToken = ensureValidAccessToken(token);
        String url = apiBaseUrl + "/users/me/calendarList";

        try {
            HttpHeaders headers = bearerHeaders(accessToken);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("items");
            if (!items.isArray()) {
                return List.of();
            }
            List<GoogleCalendarDto.CalendarItem> out = new ArrayList<>();
            for (JsonNode item : items) {
                GoogleCalendarDto.CalendarItem row = new GoogleCalendarDto.CalendarItem();
                row.setId(textOrNull(item.path("id").asText(null)));
                row.setSummary(textOrNull(item.path("summary").asText(null)));
                row.setPrimary(item.path("primary").asBoolean(false) ? "true" : "false");
                row.setAccessRole(textOrNull(item.path("accessRole").asText(null)));
                if (row.getId() != null) {
                    out.add(row);
                }
            }
            return out;
        } catch (Exception ex) {
            throw new BadRequestException("Google calendar listesi alinamadi");
        }
    }

    @Transactional
    public GoogleCalendarDto.SelectCalendarResponse selectCalendar(String userEmail, GoogleCalendarDto.SelectCalendarRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ensureEnabled();
        UserGoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Google Calendar baglantisi bulunamadi"));

        String selectedId = request.getCalendarId().trim();
        List<GoogleCalendarDto.CalendarItem> calendars = listCalendars(userEmail);
        GoogleCalendarDto.CalendarItem selected = calendars.stream()
                .filter(c -> selectedId.equals(c.getId()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Secilen calendarId kullaniciya ait degil"));

        token.setSelectedCalendarId(selected.getId());
        String summary = request.getCalendarSummary();
        token.setSelectedCalendarSummary(summary != null && !summary.isBlank() ? summary.trim() : selected.getSummary());
        tokenRepository.save(token);

        GoogleCalendarDto.SelectCalendarResponse response = new GoogleCalendarDto.SelectCalendarResponse();
        response.setSelectedCalendarId(token.getSelectedCalendarId());
        response.setSelectedCalendarSummary(token.getSelectedCalendarSummary());
        return response;
    }

    @Transactional
    public void disconnect(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        tokenRepository.findByUserId(userId).ifPresent(token -> {
            token.setDeletedAt(OffsetDateTime.now());
            tokenRepository.save(token);
        });
    }

    @Transactional
    public int resyncAll(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        int synced = 0;
        List<Reminder> reminders = reminderRepository.findByUserId(userId, Pageable.unpaged()).getContent();
        for (Reminder reminder : reminders) {
            String eventId = syncReminder(reminder);
            if (eventId != null && !eventId.equals(reminder.getGoogleCalendarEventId())) {
                reminder.setGoogleCalendarEventId(eventId);
                reminderRepository.save(reminder);
                synced++;
            }
        }
        List<WorkEvent> events = workEventRepository.findByUserId(userId, Pageable.unpaged()).getContent();
        for (WorkEvent event : events) {
            String eventId = syncWorkEvent(event);
            if (eventId != null && !eventId.equals(event.getGoogleCalendarEventId())) {
                event.setGoogleCalendarEventId(eventId);
                workEventRepository.save(event);
                synced++;
            }
        }
        List<FamilyBirthday> birthdays = familyBirthdayRepository.findByUserIdOrderByBirthDateAsc(userId, Pageable.unpaged())
                .getContent();
        for (FamilyBirthday birthday : birthdays) {
            String eventId = syncBirthday(birthday);
            if (eventId != null && !eventId.equals(birthday.getGoogleCalendarEventId())) {
                birthday.setGoogleCalendarEventId(eventId);
                familyBirthdayRepository.save(birthday);
                synced++;
            }
        }
        return synced;
    }

    @Transactional
    public String syncReminder(Reminder reminder) {
        if (!enabled || reminder == null) {
            return null;
        }
        if ("canceled".equalsIgnoreCase(reminder.getStatus())) {
            deleteReminder(reminder);
            return null;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("summary", reminder.getTitle());
        payload.put("description", "Kaynak modul: " + safe(reminder.getSourceModule()));
        payload.put("start", Map.of("dateTime", reminder.getRemindAt().toString()));
        payload.put("end", Map.of("dateTime", reminder.getRemindAt().plusMinutes(15).toString()));
        
        // Add default reminders
        payload.put("reminders", Map.of(
            "useDefault", false,
            "overrides", List.of(
                Map.of("method", "popup", "minutes", 10),
                Map.of("method", "email", "minutes", 1440)
            )
        ));

        payload.put("extendedProperties", Map.of("private", Map.of(
                "source", "reminder",
                "sourceId", reminder.getId().toString())));
        return upsertEvent(reminder.getUserId(), reminder.getGoogleCalendarEventId(), payload);
    }

    @Transactional
    public void deleteReminder(Reminder reminder) {
        if (!enabled || reminder == null) {
            return;
        }
        deleteEvent(reminder.getUserId(), reminder.getGoogleCalendarEventId());
    }

    @Transactional
    public String syncWorkEvent(WorkEvent event) {
        if (!enabled || event == null) {
            return null;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("summary", event.getTitle());
        payload.put("description", safe(event.getDescription()));
        payload.put("location", safe(event.getLocation()));
        payload.put("start", Map.of("dateTime", event.getStartTime().toString()));
        payload.put("end", Map.of("dateTime", event.getEndTime().toString()));
        
        // Add default reminders
        payload.put("reminders", Map.of(
            "useDefault", false,
            "overrides", List.of(
                Map.of("method", "popup", "minutes", 15)
            )
        ));

        payload.put("extendedProperties", Map.of("private", Map.of(
                "source", "work_event",
                "sourceId", event.getId().toString())));
        return upsertEvent(event.getUserId(), event.getGoogleCalendarEventId(), payload);
    }

    @Transactional
    public void deleteWorkEvent(WorkEvent event) {
        if (!enabled || event == null) {
            return;
        }
        deleteEvent(event.getUserId(), event.getGoogleCalendarEventId());
    }

    @Transactional
    public String syncBirthday(FamilyBirthday birthday) {
        if (!enabled || birthday == null) {
            return null;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("summary", "Dogum Gunu: " + birthday.getFullName());
        payload.put("description", safe(birthday.getNote()));
        payload.put("start", Map.of("date", birthday.getBirthDate().toString()));
        payload.put("end", Map.of("date", birthday.getBirthDate().plusDays(1).toString()));
        payload.put("recurrence", List.of("RRULE:FREQ=YEARLY"));
        
        // Add default reminders for all-day events (birthdays)
        payload.put("reminders", Map.of(
            "useDefault", false,
            "overrides", List.of(
                Map.of("method", "popup", "minutes", 24 * 60), // 1 day before
                Map.of("method", "email", "minutes", 24 * 60)
            )
        ));

        payload.put("extendedProperties", Map.of("private", Map.of(
                "source", "family_birthday",
                "sourceId", birthday.getId().toString())));
        return upsertEvent(birthday.getUserId(), birthday.getGoogleCalendarEventId(), payload);
    }

    @Transactional
    public void deleteBirthday(FamilyBirthday birthday) {
        if (!enabled || birthday == null) {
            return;
        }
        deleteEvent(birthday.getUserId(), birthday.getGoogleCalendarEventId());
    }

    private Map<String, Object> exchangeAuthCode(GoogleClientConfig cfg, String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String body = "code=" + enc(code)
                + "&client_id=" + enc(cfg.clientId)
                + "&client_secret=" + enc(cfg.clientSecret)
                + "&redirect_uri=" + enc(redirectUri)
                + "&grant_type=authorization_code";
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(cfg.tokenUri, request, String.class);
            return parseJsonToMap(response.getBody());
        } catch (RestClientResponseException ex) {
            throw new BadRequestException("Google baglanti kodu gecersiz veya suresi dolmus");
        }
    }

    private String upsertEvent(UUID userId, String existingEventId, Map<String, Object> payload) {
        Optional<UserGoogleCalendarToken> maybeToken = tokenRepository.findByUserId(userId);
        if (maybeToken.isEmpty()) {
            return null;
        }
        UserGoogleCalendarToken userToken = maybeToken.get();
        String token = ensureValidAccessToken(userToken);
        String encodedCalendarId = encPath(resolveCalendarId(userToken));
        String urlBase = apiBaseUrl + "/calendars/" + encodedCalendarId + "/events";
        try {
            if (existingEventId != null && !existingEventId.isBlank()) {
                String patchUrl = urlBase + "/" + encPath(existingEventId);
                String patchedId = patchEvent(patchUrl, token, payload);
                return patchedId == null || patchedId.isBlank() ? existingEventId : patchedId;
            }
            return createEvent(urlBase, token, payload);
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            if (status == 404 && existingEventId != null && !existingEventId.isBlank()) {
                return createEvent(urlBase, token, payload);
            }
            logger.warn("Google event upsert basarisiz. userId={}, status={}, msg={}", userId, status, ex.getMessage());
            return existingEventId;
        } catch (Exception ex) {
            logger.warn("Google event upsert hatasi. userId={}, msg={}", userId, ex.getMessage());
            return existingEventId;
        }
    }

    private void deleteEvent(UUID userId, String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return;
        }
        Optional<UserGoogleCalendarToken> maybeToken = tokenRepository.findByUserId(userId);
        if (maybeToken.isEmpty()) {
            return;
        }
        UserGoogleCalendarToken userToken = maybeToken.get();
        String token = ensureValidAccessToken(userToken);
        String url = apiBaseUrl + "/calendars/" + encPath(resolveCalendarId(userToken)) + "/events/" + encPath(eventId);
        HttpHeaders headers = bearerHeaders(token);
        try {
            restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() != 404) {
                logger.warn("Google event silinemedi. userId={}, eventId={}, msg={}", userId, eventId, ex.getMessage());
            }
        } catch (Exception ex) {
            logger.warn("Google event silme hatasi. userId={}, eventId={}, msg={}", userId, eventId, ex.getMessage());
        }
    }

    private String createEvent(String url, String accessToken, Map<String, Object> payload) {
        HttpHeaders headers = bearerHeaders(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> req = new HttpEntity<>(payload, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, req, String.class);
        return parseId(response.getBody());
    }

    private String patchEvent(String url, String accessToken, Map<String, Object> payload) {
        HttpHeaders headers = bearerHeaders(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> req = new HttpEntity<>(payload, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PATCH, req, String.class);
        return parseId(response.getBody());
    }

    private String ensureValidAccessToken(UserGoogleCalendarToken token) {
        if (token.getExpiresAt() == null || token.getExpiresAt().isAfter(OffsetDateTime.now().plusMinutes(1))) {
            return token.getAccessToken();
        }
        if (token.getRefreshToken() == null || token.getRefreshToken().isBlank()) {
            return token.getAccessToken();
        }
        GoogleClientConfig cfg = loadClientConfig();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String body = "client_id=" + enc(cfg.clientId)
                + "&client_secret=" + enc(cfg.clientSecret)
                + "&refresh_token=" + enc(token.getRefreshToken())
                + "&grant_type=refresh_token";
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(cfg.tokenUri, request, String.class);
            Map<String, Object> map = parseJsonToMap(response.getBody());
            String refreshedAccessToken = textOrNull(map.get("access_token"));
            if (refreshedAccessToken != null && !refreshedAccessToken.isBlank()) {
                token.setAccessToken(refreshedAccessToken);
            }
            String tokenType = textOrNull(map.get("token_type"));
            if (tokenType != null) {
                token.setTokenType(tokenType);
            }
            String refreshedScope = textOrNull(map.get("scope"));
            if (refreshedScope != null) {
                token.setScope(refreshedScope);
            }
            token.setExpiresAt(extractExpiry(map.get("expires_in")));
            tokenRepository.save(token);
            return token.getAccessToken();
        } catch (Exception ex) {
            logger.warn("Google token yenilenemedi. userId={}, msg={}", token.getUserId(), ex.getMessage());
            return token.getAccessToken();
        }
    }

    private GoogleClientConfig loadClientConfig() {
        if (cachedClientConfig != null) {
            return cachedClientConfig;
        }
        synchronized (this) {
            if (cachedClientConfig != null) {
                return cachedClientConfig;
            }
            if (credentialsFilePath == null || credentialsFilePath.isBlank()) {
                throw new BadRequestException("Google credentials dosya yolu ayarlanmamis");
            }
            try {
                JsonNode root = objectMapper.readTree(java.nio.file.Path.of(credentialsFilePath).toFile());
                JsonNode appNode = root.has("web") ? root.get("web") : root.get("installed");
                if (appNode == null) {
                    throw new BadRequestException("Google credentials dosyasi formati gecersiz");
                }
                GoogleClientConfig cfg = new GoogleClientConfig();
                cfg.clientId = textOrNull(appNode.path("client_id").asText(null));
                cfg.clientSecret = textOrNull(appNode.path("client_secret").asText(null));
                cfg.authUri = textOrNull(appNode.path("auth_uri").asText(DEFAULT_AUTH_URL));
                cfg.tokenUri = textOrNull(appNode.path("token_uri").asText(DEFAULT_TOKEN_URL));
                if (cfg.clientId == null || cfg.clientSecret == null) {
                    throw new BadRequestException("Google credentials dosyasinda client_id/client_secret yok");
                }
                if (cfg.authUri == null) {
                    cfg.authUri = DEFAULT_AUTH_URL;
                }
                if (cfg.tokenUri == null) {
                    cfg.tokenUri = DEFAULT_TOKEN_URL;
                }
                cachedClientConfig = cfg;
                return cfg;
            } catch (IOException ex) {
                throw new BadRequestException("Google credentials dosyasi okunamadi");
            }
        }
    }

    private HttpHeaders bearerHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private Map<String, Object> parseJsonToMap(String raw) {
        try {
            if (raw == null || raw.isBlank()) {
                return Map.of();
            }
            return objectMapper.readValue(raw, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
            });
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private String parseId(String raw) {
        try {
            if (raw == null || raw.isBlank()) {
                return null;
            }
            JsonNode root = objectMapper.readTree(raw);
            return textOrNull(root.path("id").asText(null));
        } catch (Exception ex) {
            return null;
        }
    }

    private OffsetDateTime extractExpiry(Object expiresInRaw) {
        try {
            if (expiresInRaw == null) {
                return null;
            }
            long seconds = Long.parseLong(String.valueOf(expiresInRaw));
            return OffsetDateTime.now().plusSeconds(Math.max(0, seconds));
        } catch (Exception ex) {
            return null;
        }
    }

    private String textOrNull(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() ? null : text;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String resolveCalendarId(UserGoogleCalendarToken token) {
        if (token == null || token.getSelectedCalendarId() == null || token.getSelectedCalendarId().isBlank()) {
            return calendarId;
        }
        return token.getSelectedCalendarId().trim();
    }

    private String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String encPath(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private void ensureEnabled() {
        if (!enabled) {
            throw new BadRequestException("Google Calendar entegrasyonu devre disi");
        }
    }

    private static class GoogleClientConfig {
        private String clientId;
        private String clientSecret;
        private String authUri;
        private String tokenUri;
    }
}
