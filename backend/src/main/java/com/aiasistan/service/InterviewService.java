package com.aiasistan.service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.multipart.MultipartFile;

import com.aiasistan.dto.interview.*;
import com.aiasistan.model.InterviewQuestion;
import com.aiasistan.model.InterviewSession;
import com.aiasistan.model.User;
import com.aiasistan.repository.InterviewQuestionRepository;
import com.aiasistan.repository.InterviewSessionRepository;
import com.aiasistan.repository.UserRepository;

@Service
@Transactional
public class InterviewService {
    private static final Logger logger = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final OpenRouterAiService aiService;
    private final SttService sttService;

    public InterviewService(InterviewSessionRepository sessionRepository,
            InterviewQuestionRepository questionRepository,
            UserRepository userRepository,
            OpenRouterAiService aiService,
            SttService sttService) {
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.sttService = sttService;
    }

    /**
     * Kullanıcının tüm mülakatlarını User ID ile döner.
     */
    public List<InterviewSessionResponse> getUserSessionsByUserId(UUID userId) {
        if (userId == null) {
            return List.of();
        }

        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(session -> session.getUser() != null &&
                        userId.equals(session.getUser().getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Email ile kullanıcının mülakatlarını döner.
     * Kesin filtreleme: Önce kullanıcıyı bulur, sonra o kullanıcıya ait mülakatları ID ile çeker.
     * Kod seviyesinde de mülakatların o kullanıcıya ait olduğunu doğrular.
     */
    public List<InterviewSessionResponse> getUserSessions(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return List.of();
        }
        
        // Doğrudan Repository'nin email bazlı metodunu kullanıyoruz
        return sessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .filter(s -> s.getUser() != null && userEmail.equals(s.getUser().getEmail())) // Ekstra Java katmanı kontrolü
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Adım 1: Oturumu oluşturur ve AI ile taslak soruları üretir.
     */
    public InterviewSessionResponse createSession(UUID userId, CreateInterviewSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setTitle(request.getTitle());
        session.setPosition(request.getPosition());
        session.setJobDescription(request.getJobDescription());
        session.setStatus("SETUP");

        if (request.getInterviewDate() != null && !request.getInterviewDate().isBlank()) {
            session.setInterviewDate(Instant.parse(request.getInterviewDate()));
        }

        InterviewSession savedSession = sessionRepository.save(session);

        // AI ile soruları üret
        List<OpenRouterAiService.QuestionDraft> drafts = aiService.generateInterviewQuestions(
                request.getTitle(),
                request.getPosition(),
                request.getJobDescription(),
                5 // Varsayılan 5 soru
        );

        if (drafts == null || drafts.isEmpty()) {
            throw new RuntimeException("Mülakat soruları üretilemedi. Lütfen daha sonra tekrar deneyin.");
        }

        List<InterviewQuestion> questions = new ArrayList<>();
        for (int i = 0; i < drafts.size(); i++) {
            OpenRouterAiService.QuestionDraft draft = drafts.get(i);
            InterviewQuestion q = new InterviewQuestion();
            q.setSession(savedSession);
            q.setQuestionText(draft.getText());
            q.setDifficulty(draft.getDifficulty());
            q.setOrderNo(i + 1);
            questions.add(questionRepository.save(q));
        }

        savedSession.setQuestions(questions);
        return mapToResponse(savedSession);
    }

    /**
     * Overloaded createSession - email ile
     */
    public InterviewSessionResponse createSession(String userEmail, CreateInterviewSessionRequest request) {
        UUID userId = getUserIdByEmail(userEmail);
        return createSession(userId, request);
    }

    /**
     * Oturum detaylarını kullanıcı ID kontrolü ile döner
     */
    public InterviewSessionResponse getSessionForUser(UUID sessionId, UUID userId) {
        InterviewSession session = requireSessionOwner(sessionId, userId);
        return mapToResponse(session);
    }

    /**
     * Overloaded getSessionForUser - email ile
     */
    public InterviewSessionResponse getSessionForUser(UUID sessionId, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        return getSessionForUser(sessionId, userId);
    }

    /**
     * Sadece mülakat sorularını yeniden üretir
     */
    public InterviewSessionResponse generateQuestionsForUser(UUID sessionId, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        InterviewSession session = requireSessionOwner(sessionId, userId);

        if (!"SETUP".equals(session.getStatus())) {
            throw new RuntimeException("Sadece SETUP aşamasında soruları yeniden üretebilirsiniz.");
        }

        List<OpenRouterAiService.QuestionDraft> drafts = aiService.generateInterviewQuestions(
                session.getTitle(),
                session.getPosition(),
                session.getJobDescription(),
                5 // Varsayılan numara
        );

        if (drafts == null || drafts.isEmpty()) {
            throw new RuntimeException("Mülakat soruları üretilemedi. Lütfen daha sonra tekrar deneyin.");
        }

        // 1. Mevcut soruları sil (orphanRemoval=true sayesinde)
        session.getQuestions().clear();
        sessionRepository.saveAndFlush(session); // Silme işlemini hemen yansıt

        // 2. Yeni soruları ekle
        for (int i = 0; i < drafts.size(); i++) {
            OpenRouterAiService.QuestionDraft draft = drafts.get(i);
            InterviewQuestion q = new InterviewQuestion();
            q.setSession(session);
            q.setQuestionText(draft.getText());
            q.setDifficulty(draft.getDifficulty());
            q.setOrderNo(i + 1);
            session.getQuestions().add(q);
        }

        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    /**
     * Oturum güncelleme - kullanıcı ID ile
     */
    public InterviewSessionResponse updateSessionForUser(UUID sessionId, UpdateInterviewSessionRequest request,
            UUID userId) {
        InterviewSession session = requireSessionOwner(sessionId, userId);
        return updateSession(session.getId(), request);
    }

    /**
     * Overloaded updateSessionForUser - email ile
     */
    public InterviewSessionResponse updateSessionForUser(UUID sessionId, UpdateInterviewSessionRequest request,
            String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        return updateSessionForUser(sessionId, request, userId);
    }

    /**
     * Oturum silme - kullanıcı ID ile
     */
    public void deleteSessionForUser(UUID sessionId, UUID userId) {
        InterviewSession session = requireSessionOwner(sessionId, userId);
        sessionRepository.delete(session);
    }

    /**
     * Overloaded deleteSessionForUser - email ile
     */
    public void deleteSessionForUser(UUID sessionId, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        deleteSessionForUser(sessionId, userId);
    }

    /**
     * Soruları güncelleme - kullanıcı ID ile
     */
    public InterviewSessionResponse updateQuestionsForUser(UUID sessionId, UpdateInterviewQuestionsRequest request,
            UUID userId) {
        InterviewSession session = requireSessionOwner(sessionId, userId);
        return updateQuestions(session.getId(), request);
    }

    /**
     * Overloaded updateQuestionsForUser - email ile
     */
    public InterviewSessionResponse updateQuestionsForUser(UUID sessionId, UpdateInterviewQuestionsRequest request,
            String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        return updateQuestionsForUser(sessionId, request, userId);
    }

    /**
     * Soru silme - kullanıcı ID ile
     */
    public void deleteQuestionForUser(UUID questionId, UUID userId) {
        InterviewQuestion question = requireQuestionOwner(questionId, userId);
        if (!"SETUP".equals(question.getSession().getStatus())) {
            throw new RuntimeException("Sadece SETUP aşamasında sorular silinebilir");
        }
        question.setDeleted(true);
        questionRepository.save(question);
    }

    /**
     * Overloaded deleteQuestionForUser - email ile
     */
    public void deleteQuestionForUser(UUID questionId, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        deleteQuestionForUser(questionId, userId);
    }

    /**
     * Soruları yeniden sıralama - kullanıcı ID ile
     */
    public InterviewSessionResponse reorderQuestionsForUser(UUID sessionId, UpdateQuestionOrderRequest request,
            UUID userId) {
        InterviewSession session = requireSessionOwner(sessionId, userId);
        return reorderQuestions(session.getId(), request);
    }

    /**
     * Overloaded reorderQuestionsForUser - email ile
     */
    public InterviewSessionResponse reorderQuestionsForUser(UUID sessionId, UpdateQuestionOrderRequest request,
            String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        return reorderQuestionsForUser(sessionId, request, userId);
    }

    /**
     * Mülakatı başlatma - kullanıcı ID ile
     */
    public void startAnsweringForUser(UUID sessionId, UUID userId) {
        InterviewSession session = requireSessionOwner(sessionId, userId);
        session.setStatus("IN_PROGRESS");
        sessionRepository.save(session);
    }

    /**
     * Overloaded startAnsweringForUser - email ile
     */
    public void startAnsweringForUser(UUID sessionId, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        startAnsweringForUser(sessionId, userId);
    }

    /**
     * Cevap gönderme - kullanıcı ID ile
     */
    public void submitAnswerForUser(SubmitAnswerRequest request, UUID userId) {
        InterviewQuestion question = requireQuestionOwner(request.getQuestionId(), userId);
        question.setAnswerText(request.getAnswerText());
        questionRepository.save(question);
    }

    /**
     * Overloaded submitAnswerForUser - email ile
     */
    public void submitAnswerForUser(SubmitAnswerRequest request, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        submitAnswerForUser(request, userId);
    }

    /**
     * Video cevap gönderme - kullanıcı ID ile
     */
    public String submitVideoAnswerForUser(UUID questionId, MultipartFile file, UUID userId) {
        InterviewQuestion question = requireQuestionOwner(questionId, userId);
        String transcription = sttService.transcribe(file);
        if (transcription == null || transcription.isBlank()) {
            throw new RuntimeException("Video/ses çözümlenemedi. Lütfen tekrar deneyin.");
        }
        question.setAnswerText(transcription);
        questionRepository.save(question);
        return transcription;
    }

    /**
     * Overloaded submitVideoAnswerForUser - email ile
     */
    public String submitVideoAnswerForUser(UUID questionId, MultipartFile file, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        return submitVideoAnswerForUser(questionId, file, userId);
    }

    /**
     * Mülakatı bitir ve analiz et - kullanıcı ID ile
     */
    public InterviewSessionResponse finishAndAnalyzeForUser(UUID sessionId, UUID userId) {
        InterviewSession session = requireSessionOwner(sessionId, userId);
        return finishAndAnalyze(session.getId());
    }

    /**
     * Overloaded finishAndAnalyzeForUser - email ile
     */
    public InterviewSessionResponse finishAndAnalyzeForUser(UUID sessionId, String userEmail) {
        UUID userId = getUserIdByEmail(userEmail);
        return finishAndAnalyzeForUser(sessionId, userId);
    }

    /**
     * Email'den User ID'yi bul
     */
    public UUID getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + email));
    }


    /**
     * Soru ID'sinden oturum ID'sini bul
     */
    public UUID getSessionIdByQuestionId(UUID questionId) {
        InterviewQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Soru bulunamadı: " + questionId));
        return question.getSession().getId();
    }

    /**
     * Oturum sahibi kontrolü - User ID ile
     */
    private InterviewSession requireSessionOwner(UUID sessionId, UUID userId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı: " + sessionId));

        if (session.getUser() == null || userId == null ||
                !userId.equals(session.getUser().getId())) {
            throw new AccessDeniedException("Bu oturuma erişim yetkiniz yok");
        }
        return session;
    }

    /**
     * Soru sahibi kontrolü - User ID ile
     */
    private InterviewQuestion requireQuestionOwner(UUID questionId, UUID userId) {
        InterviewQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Soru bulunamadı: " + questionId));

        InterviewSession session = question.getSession();
        if (session == null || session.getUser() == null || userId == null ||
                !userId.equals(session.getUser().getId())) {
            throw new AccessDeniedException("Bu soruya erişim yetkiniz yok");
        }
        return question;
    }

    /**
     * Oturum detaylarını döner (iç metod)
     */
    public InterviewSessionResponse getSession(UUID sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return mapToResponse(session);
    }

    /**
     * Oturumu günceller (iç metod)
     */
    public InterviewSessionResponse updateSession(UUID sessionId, UpdateInterviewSessionRequest request) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

        if (request.getTitle() != null)
            session.setTitle(request.getTitle());
        if (request.getPosition() != null)
            session.setPosition(request.getPosition());
        if (request.getJobDescription() != null)
            session.setJobDescription(request.getJobDescription());
        if (request.getInterviewDate() != null && !request.getInterviewDate().isBlank()) {
            session.setInterviewDate(Instant.parse(request.getInterviewDate()));
        }

        return mapToResponse(sessionRepository.save(session));
    }

    /**
     * Adım 2: Kullanıcının düzenlediği soruları günceller (iç metod)
     */
    public InterviewSessionResponse updateQuestions(UUID sessionId, UpdateInterviewQuestionsRequest request) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

        if (!"SETUP".equals(session.getStatus())) {
            throw new RuntimeException("Sadece SETUP aşamasında sorular düzenlenebilir");
        }

        // Mevcut soruları temizle (orphanRemoval=true otomatik fiziksel siler)
        session.getQuestions().clear();
        sessionRepository.saveAndFlush(session);

        for (UpdateInterviewQuestionsRequest.QuestionUpdateDTO dto : request.getQuestions()) {
            InterviewQuestion q = new InterviewQuestion();
            q.setSession(session);
            q.setQuestionText(dto.getQuestionText());
            q.setOrderNo(dto.getOrderNo());
            q.setDifficulty(dto.getDifficulty());
            session.getQuestions().add(q);
        }

        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    /**
     * Soruların sırasını günceller (iç metod)
     */
    public InterviewSessionResponse reorderQuestions(UUID sessionId, UpdateQuestionOrderRequest request) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

        if (!"SETUP".equals(session.getStatus())) {
            throw new RuntimeException("Sadece SETUP aşamasında sıralama değiştirilebilir");
        }

        for (UpdateQuestionOrderRequest.QuestionOrderDTO dto : request.getOrders()) {
            InterviewQuestion q = questionRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Soru bulunamadı: " + dto.getId()));
            q.setOrderNo(dto.getOrderNo());
            questionRepository.save(q);
        }

        return mapToResponse(session);
    }

    /**
     * Adım 3: Mülakatı başlatır (Status -> IN_PROGRESS) - iç metod
     */
    public void startAnswering(UUID sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));
        session.setStatus("IN_PROGRESS");
        sessionRepository.save(session);
    }

    /**
     * Adım 3 (Cevaplama - Metin): Soru cevabını kaydeder (iç metod)
     */
    public void submitAnswer(SubmitAnswerRequest request) {
        InterviewQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Soru bulunamadı"));

        question.setAnswerText(request.getAnswerText());
        questionRepository.save(question);
    }

    /**
     * Adım 3 (Cevaplama - Video/Ses): Dosyayı alır, metne çevirir ve kaydeder (iç
     * metod)
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

    public InterviewSessionResponse finishAndAnalyze(UUID sessionId) {
        try {
            InterviewSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

            List<Map<String, String>> qaPairs = session.getQuestions().stream()
                    .map(q -> {
                        Map<String, String> map = new HashMap<>();
                        map.put("question", q.getQuestionText());
                        map.put("difficulty", q.getDifficulty() != null ? q.getDifficulty() : "MEDIUM");
                        map.put("answer", q.getAnswerText() != null ? q.getAnswerText() : "Cevaplanmadı");
                        return map;
                    })
                    .collect(Collectors.toList());

            String analysis;
            try {
                analysis = aiService.analyzeInterviewPerformance(session.getPosition(), qaPairs);
            } catch (Exception e) {
                logger.error("AI Analiz hatası: {}", e.getMessage());
                analysis = "Yapay zeka analiz servisi şu an yanıt veremedi. Cevaplarınız kaydedildi.";
            }

            String analysisCleaned = analysis;
            if (analysis != null) {
                // Gereksiz AI girişlerini temizle
                analysisCleaned = analysis.replaceAll("(?i)^(Tamamdır|Pekala|Mülakatı değerlendirelim|Analiz ediyorum).*?\\n+", "");
                
                // [GENEL_OZET] etiketini bul ve sadece o kısmı al
                if (analysisCleaned.contains("[GENEL_OZET]")) {
                    int start = analysisCleaned.indexOf("[GENEL_OZET]") + 12;
                    int end = analysisCleaned.indexOf("[S1]"); 
                    if (end == -1) end = analysisCleaned.indexOf("1. Soru");
                    if (end == -1) end = analysisCleaned.indexOf("**1. Soru");
                    
                    if (end != -1 && end > start) {
                        analysisCleaned = analysisCleaned.substring(start, end).trim();
                    } else {
                        analysisCleaned = analysisCleaned.substring(start).trim();
                    }
                }
            }

            session.setOverallFeedback(analysisCleaned != null ? analysisCleaned : "Analiz hazır.");
            session.setStatus("COMPLETED");
            session.setOverallScore(extractScore(analysis, "TOTAL_SKOR"));

            // Her soru için geri bildirim ve skoru da ayrıştırıp kaydet
            List<InterviewQuestion> questions = session.getQuestions();
            for (int i = 0; i < questions.size(); i++) {
                InterviewQuestion q = questions.get(i);
                int questionNo = i + 1;
                try {
                    String block = findQuestionBlock(analysis, questionNo, questions.size());
                    Integer score = extractSkorFromBlock(block);
                    String feedback = extractFeedbackFromBlock(block);

                    q.setScore(score != null ? score : 0);
                    q.setFeedback(feedback != null ? feedback : "Detaylı geri bildirim ayrıştırılamadı.");
                    questionRepository.save(q);
                } catch (Exception eq) {
                    logger.warn("Soru detayları kaydedilirken hata (Soru ID: {}): {}", q.getId(), eq.getMessage());
                }
            }

            return mapToResponse(sessionRepository.save(session));
        } catch (Exception e) {
            logger.error("Analiz genel hatası: {}", e.getMessage(), e);
            try {
                InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
                if (session != null) {
                    session.setStatus("COMPLETED");
                    return mapToResponse(sessionRepository.save(session));
                }
            } catch (Exception e2) {}
            throw new RuntimeException("Analiz sırasında hata: " + e.getMessage());
        }
    }

    private String findQuestionBlock(String analysis, int questionNo, int totalQuestions) {
        if (analysis == null) return "";
        try {
            String startPattern = "(?i)(\\[S" + questionNo + "\\]|" + questionNo + "\\.\\s*Soru|\\*\\*" + questionNo + "\\.\\s*Soru)";
            String nextPattern = "(?i)(\\[S" + (questionNo + 1) + "\\]|" + (questionNo + 1) + "\\.\\s*Soru|\\*\\*" + (questionNo + 1) + "\\.\\s*Soru|TOPLAM PUAN|\\[TOTAL_SKOR)";
            
            java.util.regex.Pattern pStart = java.util.regex.Pattern.compile(startPattern);
            java.util.regex.Matcher mStart = pStart.matcher(analysis);
            
            if (mStart.find()) {
                int start = mStart.start();
                java.util.regex.Pattern pEnd = java.util.regex.Pattern.compile(nextPattern);
                java.util.regex.Matcher mEnd = pEnd.matcher(analysis);
                
                if (mEnd.find(mStart.end())) {
                    return analysis.substring(start, mEnd.start());
                } else {
                    return analysis.substring(start);
                }
            }
        } catch (Exception e) {}
        return "";
    }

    private Integer extractSkorFromBlock(String block) {
        if (block == null || block.isBlank()) return 0;
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("(?i)(skor|puan|skoru|başarı skoru)\\s*[:\\*\\s]*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher m = p.matcher(block);
            if (m.find()) return Integer.parseInt(m.group(2));
            
            p = java.util.regex.Pattern.compile("(\\d+)\\s*/\\s*100");
            m = p.matcher(block);
            if (m.find()) return Integer.parseInt(m.group(1));
        } catch (Exception e) {}
        return 0;
    }

    private String extractFeedbackFromBlock(String block) {
        if (block == null || block.isBlank()) return null;
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("(?i)(feedback|geri bildirim|değerlendirme)\\s*[:\\*\\s]*(.*)", java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = p.matcher(block);
            if (m.find()) {
                return m.group(2).trim().replaceAll("^[\\*\\s:]+|[\\*\\s]+$", "");
            }
        } catch (Exception e) {}
        return null;
    }

    private Integer extractQuestionScore(String analysis, String questionText) {
        try {
            // Soru metninin geçtiği yerden sonrasını al
            int qIndex = analysis.indexOf(questionText);
            if (qIndex == -1) return 0;
            
            String sub = analysis.substring(qIndex);
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)\\[SORU_SKOR:\\s*(\\d+)\\]");
            java.util.regex.Matcher matcher = pattern.matcher(sub);
            if (matcher.find()) {
                return Integer.parseInt(matcher.group(1));
            }
        } catch (Exception e) {
            logger.warn("Soru skoru ayıklanırken hata: {}", e.getMessage());
        }
        return 0;
    }

    private String extractFeedbackByTag(String analysis, String tag) {
        if (analysis == null) return null;
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)\\[" + tag + "\\s*:\\s*(.*?)\\]", java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher matcher = pattern.matcher(analysis);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        } catch (Exception e) {
            logger.warn("Tag bazlı feedback ayıklama hatası ({}): {}", tag, e.getMessage());
        }
        return null;
    }

    private String extractQuestionFeedback(String analysis, String questionText) {
        try {
            int qIndex = analysis.indexOf(questionText);
            if (qIndex == -1) return null;
            
            String sub = analysis.substring(qIndex);
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)\\[SORU_FEEDBACK:\\s*(.*?)\\]", java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher matcher = pattern.matcher(sub);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        } catch (Exception e) {
            logger.warn("Soru geri bildirimi ayıklanırken hata: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Skoru analiz metninden çıkarır
     */
    private Integer extractScore(String analysis, String tag) {
        if (analysis == null || analysis.isBlank()) return 0;
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)\\[" + tag + "\\s*:\\s*(\\d+)[^\\]]*\\]");
            java.util.regex.Matcher matcher = pattern.matcher(analysis);
            if (matcher.find()) {
                return Integer.parseInt(matcher.group(1));
            }
            
            // Fallback: look for any "Skor: 85" or "Puan: 85"
            pattern = java.util.regex.Pattern.compile("(?i)(skor|puan|başarı skoru)\\s*:\\s*(\\d+)");
            matcher = pattern.matcher(analysis);
            if (matcher.find()) {
                return Integer.parseInt(matcher.group(2));
            }
        } catch (Exception e) {
            logger.warn("Skor ayıklanırken hata: {}", e.getMessage());
        }
        return 0;
    }

    /**
     * Oturumu siler (iç metod)
     */
    public void deleteSession(UUID sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));
        sessionRepository.delete(session);
    }

    /**
     * Tekil soruyu yumuşak siler (iç metod)
     */
    public void deleteQuestion(UUID questionId) {
        InterviewQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Soru bulunamadı"));

        if (!"SETUP".equals(question.getSession().getStatus())) {
            throw new RuntimeException("Sadece SETUP aşamasında sorular silinebilir");
        }

        question.setDeleted(true);
        questionRepository.save(question);
    }

    /**
     * Session'ı Response DTO'suna dönüştürür
     */
    private InterviewSessionResponse mapToResponse(InterviewSession session) {
        InterviewSessionResponse resp = new InterviewSessionResponse();
        resp.setId(session.getId());
        resp.setUserId(session.getUser() != null ? session.getUser().getId() : null);
        resp.setTitle(session.getTitle());
        resp.setPosition(session.getPosition());
        resp.setJobDescription(session.getJobDescription());
        resp.setStatus(session.getStatus());
        resp.setOverallFeedback(session.getOverallFeedback());
        resp.setOverallScore(session.getOverallScore());
        resp.setCreatedAt(session.getCreatedAt());
        resp.setInterviewDate(session.getInterviewDate());

        List<InterviewSessionResponse.QuestionResponseDTO> qDtos = questionRepository
                .findBySessionAndIsDeletedFalseOrderByOrderNoAsc(session).stream()
                .map(q -> {
                    InterviewSessionResponse.QuestionResponseDTO qDto = new InterviewSessionResponse.QuestionResponseDTO();
                    qDto.setId(q.getId());
                    qDto.setQuestionText(q.getQuestionText());
                    qDto.setAnswerText(q.getAnswerText());
                    qDto.setFeedback(q.getFeedback());
                    qDto.setScore(q.getScore());
                    qDto.setDifficulty(q.getDifficulty());
                    qDto.setOrderNo(q.getOrderNo());
                    return qDto;
                })
                .collect(Collectors.toList());

        resp.setQuestions(qDtos);
        return resp;
    }
}