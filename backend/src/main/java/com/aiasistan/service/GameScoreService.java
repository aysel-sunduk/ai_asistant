/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.time.OffsetDateTime;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.GameScoreDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.GameScore;
import com.aiasistan.model.User;
import com.aiasistan.repository.GameScoreRepository;
import com.aiasistan.repository.UserRepository;

@Service
public class GameScoreService {
    private static final Set<String> ALLOWED_DIFFICULTY = Set.of("easy", "medium", "hard");

    private final GameScoreRepository gameScoreRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final SocialFollowService socialFollowService;

    public GameScoreService(
        GameScoreRepository gameScoreRepository,
        UserRepository userRepository,
        UserService userService,
        SocialFollowService socialFollowService
    ) {
        this.gameScoreRepository = gameScoreRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.socialFollowService = socialFollowService;
    }

    @Transactional
    public GameScoreDto.Response createScore(String userEmail, GameScoreDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        String normalizedGameKey = normalizeGameKey(request.resolveGameKey());

        GameScore score = gameScoreRepository.findTopByUserIdAndGameKeyOrderByPlayedAtDesc(userId, normalizedGameKey)
            .orElseGet(GameScore::new);
        score.setUserId(userId);
        score.setGameKey(normalizedGameKey);
        score.setScore(request.getScore());
        score.setDifficulty(normalizeDifficulty(request.getDifficulty()));
        score.setDurationSec(request.resolveDurationSec());
        score.setLevel(request.getLevel());
        score.setPlayedAt(request.resolvePlayedAt());
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
            .findLatestPerUserByGameKeyOrderByScoreDesc(normalizeGameKey(gameKey), pageable)
            .map(GameScoreDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<String> getActiveGameKeys() {
        return gameScoreRepository.findActiveGameKeys();
    }

    @Transactional(readOnly = true)
    public List<GameScoreDto.Response> getMyScoresList(String userEmail, String gameKey) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        if (gameKey == null || gameKey.isBlank()) {
            return gameScoreRepository.findByUserIdOrderByPlayedAtDesc(userId).stream()
                .map(GameScoreDto.Response::from)
                .toList();
        }
        return gameScoreRepository.findByUserIdAndGameKeyOrderByPlayedAtDesc(userId, normalizeGameKey(gameKey)).stream()
            .map(GameScoreDto.Response::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<GameScoreDto.Response> getLeaderboardTopList(String gameKey, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        return gameScoreRepository.findLatestPerUserByGameKeyOrderByScoreDesc(
                normalizeGameKey(gameKey),
                org.springframework.data.domain.PageRequest.of(0, safeLimit)
            ).getContent().stream()
            .map(GameScoreDto.Response::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<GameScoreDto.FollowingLeaderboardResponse> getFollowingLeaderboard(
        String userEmail,
        String gameKey,
        Pageable pageable
    ) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        List<UUID> followingIds = socialFollowService.getFollowingUserIds(userId);
        if (followingIds.isEmpty()) {
            return PageResponse.of(Page.empty(pageable));
        }

        Page<GameScore> page = gameScoreRepository
            .findLatestPerUserByGameKeyAndUserIdInOrderByScoreDesc(normalizeGameKey(gameKey), followingIds, pageable);

        Map<UUID, User> userMap = userRepository.findAllById(
            page.getContent().stream().map(GameScore::getUserId).toList()
        ).stream().collect(Collectors.toMap(User::getId, Function.identity()));

        int pageOffset = pageable.getPageNumber() * pageable.getPageSize();
        List<GameScoreDto.FollowingLeaderboardResponse> content = java.util.stream.IntStream
            .range(0, page.getContent().size())
            .mapToObj(i -> mapFollowingLeaderboardRow(page.getContent().get(i), userMap, pageOffset + i + 1))
            .filter(java.util.Objects::nonNull)
            .toList();

        Page<GameScoreDto.FollowingLeaderboardResponse> mapped = new org.springframework.data.domain.PageImpl<>(
            content,
            pageable,
            page.getTotalElements()
        );
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public GameScoreDto.RankSummaryResponse getRankSummary(String userEmail, String gameKey) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        String normalizedGameKey = normalizeGameKey(gameKey);

        Integer bestScore = gameScoreRepository.findBestScoreByGameKeyAndUserId(normalizedGameKey, userId);
        long globalPlayerCount = gameScoreRepository.countPlayersByGameKey(normalizedGameKey);

        List<UUID> networkUserIds = new java.util.ArrayList<>(socialFollowService.getFollowingUserIds(userId));
        if (!networkUserIds.contains(userId)) {
            networkUserIds.add(userId);
        }
        long friendsPlayerCount = networkUserIds.isEmpty()
            ? 0
            : gameScoreRepository.countPlayersByGameKeyAndUserIds(normalizedGameKey, networkUserIds);

        GameScoreDto.RankSummaryResponse response = new GameScoreDto.RankSummaryResponse();
        response.setGameKey(normalizedGameKey);
        response.setBestScore(bestScore);
        response.setGlobalPlayerCount(globalPlayerCount);
        response.setFriendsPlayerCount(friendsPlayerCount);

        if (bestScore == null) {
            response.setGlobalRank(null);
            response.setFriendsRank(null);
            return response;
        }

        response.setGlobalRank((int) gameScoreRepository.calculateGlobalRankByBestScore(normalizedGameKey, bestScore));
        if (networkUserIds.isEmpty()) {
            response.setFriendsRank(null);
        } else {
            response.setFriendsRank((int) gameScoreRepository.calculateFriendsRankByBestScore(normalizedGameKey, networkUserIds, bestScore));
        }
        return response;
    }

    @Transactional
    public void deleteScore(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        GameScore score = gameScoreRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Oyun skoru bulunamadi"));
        score.setDeletedAt(OffsetDateTime.now());
        gameScoreRepository.save(score);
    }

    private String normalizeGameKey(String gameKey) {
        String normalized = gameKey == null ? "" : gameKey.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new BadRequestException("gameKey zorunludur");
        }
        if (!gameScoreRepository.isSupportedGameKey(normalized)) {
            throw new BadRequestException("Desteklenmeyen gameKey. Desteklenenler: memory, quiz, sudoku");
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

    private GameScoreDto.FollowingLeaderboardResponse mapFollowingLeaderboardRow(
        GameScore score,
        Map<UUID, User> userMap,
        int rank
    ) {
        User user = userMap.get(score.getUserId());
        if (user == null) {
            return null;
        }
        GameScoreDto.FollowingLeaderboardResponse row = new GameScoreDto.FollowingLeaderboardResponse();
        row.setRank(rank);
        row.setUserId(user.getId());
        row.setEmail(user.getEmail());
        row.setFirstName(user.getFirstName());
        row.setLastName(user.getLastName());
        row.setScore(score.getScore());
        row.setDifficulty(score.getDifficulty());
        row.setDurationSec(score.getDurationSec());
        row.setLevel(score.getLevel());
        row.setPlayedAt(score.getPlayedAt());
        return row;
    }
}
