package com.aiasistan.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.aiasistan.dto.interview.*;
import com.aiasistan.model.User;
import com.aiasistan.service.InterviewService;

@RestController
@RequestMapping("/v1/ai/interview")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
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
     */
    @GetMapping("/{id}")
    public ResponseEntity<InterviewSessionResponse> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(interviewService.getSession(id));
    }

    /**
     * Adım 2: AI tarafından üretilen soruları düzenler.
     */
    @PutMapping("/{id}/questions")
    public ResponseEntity<InterviewSessionResponse> updateQuestions(
            @PathVariable UUID id,
            @RequestBody UpdateInterviewQuestionsRequest request) {
        return ResponseEntity.ok(interviewService.updateQuestions(id, request));
    }

    /**
     * Tekil soruyu siler (Soft delete).
     */
    @DeleteMapping("/question/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID id) {
        interviewService.deleteQuestion(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Soruların sırasını günceller.
     */
    @PutMapping("/{id}/questions/reorder")
    public ResponseEntity<InterviewSessionResponse> reorderQuestions(
            @PathVariable UUID id,
            @RequestBody UpdateQuestionOrderRequest request) {
        return ResponseEntity.ok(interviewService.reorderQuestions(id, request));
    }

    /**
     * Adım 3: Mülakatı başlatır (Soru cevaplama evresi).
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<Void> startInterview(@PathVariable UUID id) {
        interviewService.startAnswering(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Adım 3: Her bir soru için cevap gönderir.
     */
    @PostMapping("/answer")
    public ResponseEntity<Void> submitAnswer(@Valid @RequestBody SubmitAnswerRequest request) {
        interviewService.submitAnswer(request);
        return ResponseEntity.ok().build();
    }

    /**
     * Adım 3 (Görüntülü/Sesli): Her bir soru için video/ses dosyası gönderir.
     */
    @PostMapping("/answer-video")
    public ResponseEntity<String> submitVideoAnswer(
            @RequestParam("questionId") UUID questionId,
            @RequestParam("file") MultipartFile file) {
        String transcription = interviewService.submitVideoAnswer(questionId, file);
        return ResponseEntity.ok(transcription);
    }

    /**
     * Adım 4: Mülakatı bitirir ve toplu analiz sonucunu döner.
     */
    @PostMapping("/{id}/analyze")
    public ResponseEntity<InterviewSessionResponse> analyzeInterview(@PathVariable UUID id) {
        return ResponseEntity.ok(interviewService.finishAndAnalyze(id));
    }
}
