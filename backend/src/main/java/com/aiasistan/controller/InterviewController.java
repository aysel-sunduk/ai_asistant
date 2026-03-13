package com.aiasistan.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.aiasistan.dto.interview.*;
import com.aiasistan.service.InterviewService;

@RestController
@RequestMapping("/v1/ai/interview")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    /**
     * Kullanıcının tüm mülakatlarını listeler.
     * Endpoint: GET /v1/ai/interview/my-sessions
     */
    @GetMapping("/my-sessions")
    public ResponseEntity<List<InterviewSessionResponse>> getMySessions(
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(interviewService.getUserSessions(authentication.getName()));
    }

    /**
     * Kullanıcının mülakatlarını listeleyen standart endpoint.
     * Frontend'deki "Mülakatlarım" kısmı için kullanılır.
     * Endpoint: GET /v1/ai/interview/my-interviews
     */
    @GetMapping("/my-interviews")
    public ResponseEntity<List<InterviewSessionResponse>> getMyInterviews(
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(interviewService.getUserSessions(authentication.getName()));
    }


    /**
     * Kullanıcının mülakatlarını listeleyen alternatif endpoint.
     * Endpoint: GET /v1/ai/interview/list-by-user
     */
    @GetMapping("/list-by-user")
    public ResponseEntity<List<InterviewSessionResponse>> getSessionsByUser(
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(interviewService.getUserSessions(authentication.getName()));
    }

    /**
     * Adım 1: Yeni mülakat oturumu başlatır ve AI soruları üretir.
     */
    @PostMapping("/create")
    public ResponseEntity<InterviewSessionResponse> createSession(
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody CreateInterviewSessionRequest request) {
        return ResponseEntity.ok(interviewService.createSession(authentication.getName(), request));
    }

    /**
     * Adım 1.5: Oturum detaylarını (sorularıyla birlikte) çeker.
     * Sadece oturum sahibi erişebilir.
     */
    @GetMapping("/{id}")
    public ResponseEntity<InterviewSessionResponse> getSession(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id) {
        return ResponseEntity.ok(interviewService.getSessionForUser(id, authentication.getName()));
    }

    /**
     * Oturumu günceller. Sadece oturum sahibi yapabilir.
     */
    @PutMapping("/{id}")
    public ResponseEntity<InterviewSessionResponse> updateSession(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id,
            @RequestBody UpdateInterviewSessionRequest request) {
        return ResponseEntity.ok(interviewService.updateSessionForUser(id, request, authentication.getName()));
    }

    /**
     * Oturumu siler. Sadece oturum sahibi yapabilir.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id) {
        interviewService.deleteSessionForUser(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * Adım 2: AI tarafından üretilen soruları düzenler.
     * Sadece oturum sahibi yapabilir.
     */
    @PutMapping("/{id}/questions")
    public ResponseEntity<InterviewSessionResponse> updateQuestions(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id,
            @RequestBody UpdateInterviewQuestionsRequest request) {
        return ResponseEntity.ok(interviewService.updateQuestionsForUser(id, request, authentication.getName()));
    }

    /**
     * Tekil soruyu siler (Soft delete). Sadece oturum sahibi yapabilir.
     */
    @DeleteMapping("/question/{id}")
    public ResponseEntity<Void> deleteQuestion(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id) {
        interviewService.deleteQuestionForUser(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * Soruların sırasını günceller. Sadece oturum sahibi yapabilir.
     */
    @PutMapping("/{id}/questions/reorder")
    public ResponseEntity<InterviewSessionResponse> reorderQuestions(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id,
            @RequestBody UpdateQuestionOrderRequest request) {
        return ResponseEntity.ok(interviewService.reorderQuestionsForUser(id, request, authentication.getName()));
    }

    /**
     * Adım 3: Mülakatı başlatır (Soru cevaplama evresi).
     * Sadece oturum sahibi yapabilir.
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<Void> startInterview(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id) {
        interviewService.startAnsweringForUser(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * Adım 3: Her bir soru için cevap gönderir. Sadece oturum sahibi yapabilir.
     */
    @PostMapping("/answer")
    public ResponseEntity<Void> submitAnswer(
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody SubmitAnswerRequest request) {
        interviewService.submitAnswerForUser(request, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * Adım 3 (Görüntülü/Sesli): Her bir soru için video/ses dosyası gönderir.
     * Sadece oturum sahibi yapabilir.
     */
    @PostMapping("/answer-video")
    public ResponseEntity<String> submitVideoAnswer(
            org.springframework.security.core.Authentication authentication,
            @RequestParam("questionId") UUID questionId,
            @RequestParam("file") MultipartFile file) {
        String transcription = interviewService.submitVideoAnswerForUser(questionId, file, authentication.getName());
        return ResponseEntity.ok(transcription);
    }

    /**
     * Adım 4: Mülakatı bitirir ve toplu analiz sonucunu döner.
     * Sadece oturum sahibi yapabilir.
     */
    @PostMapping("/{id}/analyze")
    public ResponseEntity<InterviewSessionResponse> analyzeInterview(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID id) {
        return ResponseEntity.ok(interviewService.finishAndAnalyzeForUser(id, authentication.getName()));
    }
}
