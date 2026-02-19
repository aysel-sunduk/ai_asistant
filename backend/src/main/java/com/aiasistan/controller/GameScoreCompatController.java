package com.aiasistan.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.dto.GameScoreCompatDto;
import com.aiasistan.dto.GameScoreDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.service.GameScoreService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/games")
public class GameScoreCompatController {
    private final GameScoreService gameScoreService;

    public GameScoreCompatController(GameScoreService gameScoreService) {
        this.gameScoreService = gameScoreService;
    }

    @GetMapping("/scores")
    public ResponseEntity<List<GameScoreCompatDto>> getMyScores(
        Authentication authentication,
        @RequestParam(required = false) String gameType
    ) {
        List<GameScoreCompatDto> response = gameScoreService.getMyScoresList(authentication.getName(), gameType).stream()
            .map(GameScoreCompatDto::from)
            .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getGameTypes() {
        return ResponseEntity.ok(gameScoreService.getActiveGameKeys());
    }

    @PostMapping("/scores")
    public ResponseEntity<GameScoreCompatDto> submitScore(
        Authentication authentication,
        @Valid @RequestBody GameScoreCompatDto.SubmitRequest request
    ) {
        GameScoreDto.Request createRequest = new GameScoreDto.Request();
        createRequest.setGameKey(resolveGameKey(request));
        createRequest.setScore(request.getScore());
        createRequest.setLevel(request.getLevel());
        createRequest.setDurationSec(request.getDuration());
        createRequest.setDifficulty(request.getDifficulty());
        createRequest.setMetadata(request.getMetadata());
        createRequest.setPlayedAt(request.getCreatedAt());

        GameScoreDto.Response created = gameScoreService.createScore(authentication.getName(), createRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(GameScoreCompatDto.from(created));
    }

    @GetMapping("/leaderboard/{gameKey}")
    public ResponseEntity<List<GameScoreCompatDto>> getLeaderboard(
        @PathVariable String gameKey,
        @RequestParam(defaultValue = "50") @Min(1) @Max(200) int limit
    ) {
        List<GameScoreCompatDto> response = gameScoreService.getLeaderboardTopList(gameKey, limit).stream()
            .map(GameScoreCompatDto::from)
            .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leaderboard/following/{gameKey}")
    public ResponseEntity<List<GameScoreCompatDto.FollowingLeaderboardRow>> getFollowingLeaderboard(
        Authentication authentication,
        @PathVariable String gameKey,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        var response = gameScoreService.getFollowingLeaderboard(
            authentication.getName(),
            gameKey,
            PageRequest.of(page, size)
        ).getContent().stream()
            .map(GameScoreCompatDto.FollowingLeaderboardRow::from)
            .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rank-summary/{gameKey}")
    public ResponseEntity<GameScoreCompatDto.RankSummary> getRankSummary(
        Authentication authentication,
        @PathVariable String gameKey
    ) {
        GameScoreCompatDto.RankSummary response = GameScoreCompatDto.RankSummary.from(
            gameScoreService.getRankSummary(authentication.getName(), gameKey)
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/scores/{id}")
    public ResponseEntity<Void> deleteScore(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        gameScoreService.deleteScore(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    private String resolveGameKey(GameScoreCompatDto.SubmitRequest request) {
        if (request.getGameType() != null && !request.getGameType().isBlank()) {
            return request.getGameType();
        }
        if (request.getGameKey() != null && !request.getGameKey().isBlank()) {
            return request.getGameKey();
        }
        throw new BadRequestException("gameType veya gameKey zorunludur");
    }
}
