package com.aiasistan.service;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.GameScoreDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.GameScore;
import com.aiasistan.repository.GameScoreRepository;

@Service
public class GameScoreService {
    private static final Set<String> ALLOWED_DIFFICULTY = Set.of("easy", "medium", "hard");

    private final GameScoreRepository gameScoreRepository;
    private final UserService userService;

    public GameScoreService(GameScoreRepository gameScoreRepository, UserService userService) {
        this.gameScoreRepository = gameScoreRepository;
        this.userService = userService;
    }

    @Transactional
    public GameScoreDto.Response createScore(String userEmail, GameScoreDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        GameScore score = new GameScore();
        score.setUserId(userId);
        score.setGameKey(normalizeGameKey(request.getGameKey()));
        score.setScore(request.getScore());
        score.setDifficulty(normalizeDifficulty(request.getDifficulty()));
        score.setDurationSec(request.getDurationSec());
        score.setMetadata(request.getMetadata());

        return GameScoreDto.Response.from(gameScoreRepository.save(score));
    }

    @Transactional(readOnly = true)
    public GameScoreDto.Response getScoreById(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        GameScore score = gameScoreRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Oyun skoru bulunamadi"));
        return GameScoreDto.Response.from(score);
    }

    @Transactional(readOnly = true)
    public PageResponse<GameScoreDto.Response> getMyScores(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<GameScoreDto.Response> page = gameScoreRepository.findByUserId(userId, pageable)
            .map(GameScoreDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<GameScoreDto.Response> getLeaderboard(String gameKey, Pageable pageable) {
        Page<GameScoreDto.Response> page = gameScoreRepository
            .findByGameKeyOrderByScoreDesc(normalizeGameKey(gameKey), pageable)
            .map(GameScoreDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional
    public void deleteScore(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        GameScore score = gameScoreRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Oyun skoru bulunamadi"));
        gameScoreRepository.delete(score);
    }

    private String normalizeGameKey(String gameKey) {
        String normalized = gameKey == null ? "" : gameKey.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new BadRequestException("gameKey zorunludur");
        }
        return normalized;
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return "medium";
        }
        String normalized = difficulty.trim().toLowerCase(Locale.ROOT);
        return ALLOWED_DIFFICULTY.contains(normalized) ? normalized : "medium";
    }
}
