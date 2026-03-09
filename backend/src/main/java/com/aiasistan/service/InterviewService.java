package com.aiasistan.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;
import com.aiasistan.dto.interview.*;
import com.aiasistan.model.InterviewQuestion;
import com.aiasistan.model.InterviewSession;
import com.aiasistan.model.User;
import com.aiasistan.repository.InterviewQuestionRepository;
import com.aiasistan.repository.InterviewSessionRepository;
import com.aiasistan.service.SttService;
import com.aiasistan.service.OpenRouterAiService;

@Service
@Transactional
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final OpenRouterAiService aiService;
    private final SttService sttService;

    public InterviewService(InterviewSessionRepository sessionRepository,
            InterviewQuestionRepository questionRepository,
            OpenRouterAiService aiService,
            SttService sttService) {
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
        this.aiService = aiService;
        this.sttService = sttService;
    }

    /**
     * Adım 1: Oturumu oluşturur ve AI ile taslak soruları üretir.
     */
    public InterviewSessionResponse createSession(User user, CreateInterviewSessionRequest request) {
        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setTitle(request.getTitle());
        session.setPosition(request.getPosition());
        session.setJobDescription(request.getJobDescription());
        session.setStatus("SETUP");

        InterviewSession savedSession = sessionRepository.save(session);

        // AI ile soruları üret
        List<String> questionsText = aiService.generateInterviewQuestions(
                request.getTitle(),
                request.getPosition(),
                request.getJobDescription(),
                5 // Varsayılan 5 soru
        );

        List<InterviewQuestion> questions = new ArrayList<>();
        for (int i = 0; i < questionsText.size(); i++) {
            InterviewQuestion q = new InterviewQuestion();
            q.setSession(savedSession);
            q.setQuestionText(questionsText.get(i));
            q.setOrderNo(i + 1);
            questions.add(questionRepository.save(q));
        }

        savedSession.setQuestions(questions);
        return mapToResponse(savedSession);
    }

    /**
     * Adım 2: Kullanıcının düzenlediği soruları günceller.
     */
    public InterviewSessionResponse updateQuestions(UUID sessionId, UpdateInterviewQuestionsRequest request) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

        if (!"SETUP".equals(session.getStatus())) {
            throw new RuntimeException("Sadece SETUP aşamasında sorular düzenlenebilir");
        }

        // Mevcut soruları temizle (Kariyer.net mantığı: kullanıcı
        // silebilir/düzenleyebilir)
        questionRepository.deleteAll(session.getQuestions());
        session.getQuestions().clear();

        List<InterviewQuestion> newQuestions = new ArrayList<>();
        for (UpdateInterviewQuestionsRequest.QuestionUpdateDTO dto : request.getQuestions()) {
            InterviewQuestion q = new InterviewQuestion();
            q.setSession(session);
            q.setQuestionText(dto.getQuestionText());
            q.setOrderNo(dto.getOrderNo());
            newQuestions.add(questionRepository.save(q));
        }

        session.setQuestions(newQuestions);
        return mapToResponse(session);
    }

    /**
     * Adım 3: Mülakatı başlatır (Status -> IN_PROGRESS).
     */
    public void startAnswering(UUID sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));
        session.setStatus("IN_PROGRESS");
        sessionRepository.save(session);
    }

    /**
     * Adım 3 (Cevaplama - Metin): Soru cevabını kaydeder.
     */
    public void submitAnswer(SubmitAnswerRequest request) {
        InterviewQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Soru bulunamadı"));

        question.setAnswerText(request.getAnswerText());
        questionRepository.save(question);
    }

    /**
     * Adım 3 (Cevaplama - Video/Ses): Dosyayı alır, metne çevirir ve kaydeder.
     */
    public String submitVideoAnswer(UUID questionId, MultipartFile file) {
        InterviewQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Soru bulunamadı"));

        String transcription = sttService.transcribe(file);
        if (transcription == null || transcription.isBlank()) {
            throw new RuntimeException("Video/ses çözümlenemedi. Lütfen tekrar deneyin.");
        }

        question.setAnswerText(transcription);
        questionRepository.save(question);

        return transcription;
    }

    /**
     * Adım 4: Mülakatı bitirir ve toplu analiz yapar.
     */
    public InterviewSessionResponse finishAndAnalyze(UUID sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

        List<Map<String, String>> qaPairs = session.getQuestions().stream()
                .map(q -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("question", q.getQuestionText());
                    map.put("answer", q.getAnswerText() != null ? q.getAnswerText() : "Cevaplanmadı");
                    return map;
                })
                .collect(Collectors.toList());

        String analysis = aiService.analyzeInterviewPerformance(session.getPosition(), qaPairs);

        session.setOverallFeedback(analysis);
        session.setStatus("COMPLETED");

        // Skoru ayıkla (OpenRouter "SKOR: 85" dönüyor demiştik)
        session.setOverallScore(extractScore(analysis));

        return mapToResponse(sessionRepository.save(session));
    }

    private Integer extractScore(String analysis) {
        try {
            int index = analysis.indexOf("[SKOR:");
            if (index != -1) {
                String scoreStr = analysis.substring(index + 6, analysis.indexOf("]", index)).trim();
                return Integer.parseInt(scoreStr);
            }
        } catch (Exception e) {
            // Log error
        }
        return 0;
    }

    private InterviewSessionResponse mapToResponse(InterviewSession session) {
        InterviewSessionResponse resp = new InterviewSessionResponse();
        resp.setId(session.getId());
        resp.setTitle(session.getTitle());
        resp.setPosition(session.getPosition());
        resp.setJobDescription(session.getJobDescription());
        resp.setStatus(session.getStatus());
        resp.setOverallFeedback(session.getOverallFeedback());
        resp.setOverallScore(session.getOverallScore());
        resp.setCreatedAt(session.getCreatedAt());

        List<InterviewSessionResponse.QuestionResponseDTO> qDtos = session.getQuestions().stream()
                .map(q -> {
                    InterviewSessionResponse.QuestionResponseDTO qDto = new InterviewSessionResponse.QuestionResponseDTO();
                    qDto.setId(q.getId());
                    qDto.setQuestionText(q.getQuestionText());
                    qDto.setAnswerText(q.getAnswerText());
                    qDto.setFeedback(q.getFeedback());
                    qDto.setScore(q.getScore());
                    qDto.setOrderNo(q.getOrderNo());
                    return qDto;
                })
                .collect(Collectors.toList());

        resp.setQuestions(qDtos);
        return resp;
    }
}
