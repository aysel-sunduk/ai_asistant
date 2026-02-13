package com.aiasistan.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.MailDraftDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.MailDraft;
import com.aiasistan.repository.MailDraftRepository;

@Service
public class MailDraftService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final MailDraftRepository mailDraftRepository;
    private final UserService userService;

    public MailDraftService(MailDraftRepository mailDraftRepository, UserService userService) {
        this.mailDraftRepository = mailDraftRepository;
        this.userService = userService;
    }

    @Transactional
    public MailDraftDto.Response createDraft(String userEmail, MailDraftDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        MailDraft draft = new MailDraft();
        draft.setUserId(userId);
        applyRequest(draft, request);
        if (draft.getDraftContent() == null || draft.getDraftContent().isBlank()) {
            draft.setDraftContent(buildDraftContent(
                request.getToEmail(),
                request.getSubject(),
                request.getPurpose(),
                request.getTone(),
                request.getLanguage(),
                request.getKeyPoints()
            ));
        }

        return MailDraftDto.Response.from(mailDraftRepository.save(draft));
    }

    @Transactional(readOnly = true)
    public MailDraftDto.Response getDraftById(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        MailDraft draft = findOwnedDraft(userId, id);
        return MailDraftDto.Response.from(draft);
    }

    @Transactional(readOnly = true)
    public PageResponse<MailDraftDto.Response> getDrafts(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<MailDraftDto.Response> page = mailDraftRepository.findByUserId(userId, pageable)
            .map(MailDraftDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional
    public MailDraftDto.Response updateDraft(String userEmail, UUID id, MailDraftDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        MailDraft draft = findOwnedDraft(userId, id);

        applyRequest(draft, request);
        if (draft.getDraftContent() == null || draft.getDraftContent().isBlank()) {
            draft.setDraftContent(buildDraftContent(
                request.getToEmail(),
                request.getSubject(),
                request.getPurpose(),
                request.getTone(),
                request.getLanguage(),
                request.getKeyPoints()
            ));
        }

        return MailDraftDto.Response.from(mailDraftRepository.save(draft));
    }

    @Transactional
    public MailDraftDto.Response regenerateDraft(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        MailDraft draft = findOwnedDraft(userId, id);

        draft.setDraftContent(buildDraftContent(
            draft.getToEmail(),
            draft.getSubject(),
            draft.getPurpose(),
            draft.getTone(),
            draft.getLanguage(),
            draft.getKeyPoints()
        ));

        return MailDraftDto.Response.from(mailDraftRepository.save(draft));
    }

    @Transactional(readOnly = true)
    public MailDraftDto.GenerateResponse generatePreview(MailDraftDto.GenerateRequest request) {
        MailDraftDto.GenerateResponse response = new MailDraftDto.GenerateResponse();
        response.setDraftContent(buildDraftContent(
            request.getToEmail(),
            request.getSubject(),
            request.getPurpose(),
            request.getTone(),
            request.getLanguage(),
            request.getKeyPoints()
        ));
        return response;
    }

    @Transactional
    public void deleteDraft(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        MailDraft draft = findOwnedDraft(userId, id);
        mailDraftRepository.delete(draft);
    }

    private MailDraft findOwnedDraft(UUID userId, UUID id) {
        return mailDraftRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Mail taslagi bulunamadi"));
    }

    private void applyRequest(MailDraft draft, MailDraftDto.Request request) {
        String toEmail = request.getToEmail().trim().toLowerCase(Locale.ROOT);
        validateEmail(toEmail, "toEmail");
        String[] cc = normalizeEmailList(request.getCcEmails(), "ccEmails");
        String[] bcc = normalizeEmailList(request.getBccEmails(), "bccEmails");
        validateRecipientConflicts(toEmail, cc, bcc);

        String subject = request.getSubject().trim();
        if (subject.length() < 3 || subject.length() > 200) {
            throw new BadRequestException("Konu 3-200 karakter arasinda olmali");
        }

        draft.setToEmail(toEmail);
        draft.setCcEmails(cc);
        draft.setBccEmails(bcc);
        draft.setSubject(subject);
        draft.setPurpose(request.getPurpose());
        draft.setTone(normalizeTone(request.getTone()));
        draft.setLanguage(normalizeLanguage(request.getLanguage()));
        draft.setKeyPoints(request.getKeyPoints());
        draft.setDraftContent(request.getDraftContent());
        draft.setStatus(normalizeStatus(request.getStatus()));
    }

    private String normalizeTone(String tone) {
        if (tone == null || tone.isBlank()) {
            return "professional";
        }
        return tone.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "tr";
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "tr", "en" -> normalized;
            default -> "tr";
        };
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "draft";
        }
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "draft", "ready", "sent", "archived" -> normalized;
            default -> "draft";
        };
    }

    private String buildDraftContent(
        String toEmail,
        String subject,
        String purpose,
        String tone,
        String language,
        List<Map<String, Object>> keyPoints
    ) {
        String lang = normalizeLanguage(language);
        String normalizedTone = normalizeTone(tone);

        String greeting = lang.equals("en") ? "Hello" : "Merhaba";
        String introLabel = lang.equals("en") ? "I am writing regarding" : "Size su konuda yaziyorum";
        String closing = lang.equals("en") ? "Best regards" : "Iyi calismalar";

        StringBuilder sb = new StringBuilder();
        sb.append(greeting).append(",\n\n");
        sb.append(introLabel).append(": ").append(subject).append(".\n");

        if (purpose != null && !purpose.isBlank()) {
            sb.append(lang.equals("en") ? "Purpose" : "Amac").append(": ").append(purpose).append(".\n");
        }

        if (keyPoints != null && !keyPoints.isEmpty()) {
            sb.append("\n").append(lang.equals("en") ? "Key points" : "Ana maddeler").append(":\n");
            String bulletText = keyPoints.stream()
                .map(this::extractPointText)
                .filter(s -> s != null && !s.isBlank())
                .map(s -> "- " + s)
                .collect(Collectors.joining("\n"));
            if (!bulletText.isBlank()) {
                sb.append(bulletText).append("\n");
            }
        }

        sb.append("\n");
        sb.append(lang.equals("en") ? "Tone" : "Ton").append(": ").append(normalizedTone).append("\n");
        sb.append("\n").append(closing).append(",\n");
        sb.append(lang.equals("en") ? "AI Assistant" : "AI Asistan");

        return sb.toString();
    }

    private String extractPointText(Map<String, Object> point) {
        if (point == null || point.isEmpty()) {
            return null;
        }
        if (point.containsKey("text")) {
            Object value = point.get("text");
            return value == null ? null : String.valueOf(value);
        }
        if (point.containsKey("title")) {
            Object value = point.get("title");
            return value == null ? null : String.valueOf(value);
        }
        Object firstValue = point.values().stream().findFirst().orElse(null);
        return firstValue == null ? null : String.valueOf(firstValue);
    }

    private void validateEmail(String email, String fieldName) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException(fieldName + " gecersiz e-posta formatinda");
        }
    }

    private String[] normalizeEmailList(String[] emails, String fieldName) {
        if (emails == null || emails.length == 0) {
            return null;
        }
        String[] normalized = java.util.Arrays.stream(emails)
            .filter(e -> e != null && !e.isBlank())
            .map(e -> e.trim().toLowerCase(Locale.ROOT))
            .distinct()
            .limit(20)
            .toArray(String[]::new);
        for (String email : normalized) {
            validateEmail(email, fieldName);
        }
        return normalized.length == 0 ? null : normalized;
    }

    private void validateRecipientConflicts(String toEmail, String[] cc, String[] bcc) {
        if (cc != null && java.util.Arrays.asList(cc).contains(toEmail)) {
            throw new BadRequestException("toEmail ve ccEmails ayni adresi iceremez");
        }
        if (bcc != null && java.util.Arrays.asList(bcc).contains(toEmail)) {
            throw new BadRequestException("toEmail ve bccEmails ayni adresi iceremez");
        }
    }
}
