/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO: Uyumluluk amaçlı oyun skoru verisi.
 */
public class GameScoreCompatDto {
    private UUID id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String gameType;
    private Integer score;
    private Integer level;
    private Integer duration;
    private OffsetDateTime createdAt;

    public static GameScoreCompatDto from(GameScoreDto.Response response) {
        GameScoreCompatDto dto = new GameScoreCompatDto();
        dto.id = response.getId();
        dto.userId = response.getUserId();
        dto.gameType = response.getGameKey();
        dto.score = response.getScore();
        dto.level = response.getLevel();
        dto.duration = response.getDurationSec();
        dto.createdAt = response.getPlayedAt();
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getGameType() {
        return gameType;
    }

    public void setGameType(String gameType) {
        this.gameType = gameType;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class SubmitRequest {
        private String gameType;
        private String gameKey;

        @NotNull(message = "Skor zorunludur")
        @Min(value = 0, message = "Skor negatif olamaz")
        private Integer score;

        @Min(value = 1, message = "Seviye 1 veya daha buyuk olmali")
        private Integer level;

        @Min(value = 0, message = "Sure negatif olamaz")
        private Integer duration;

        private String difficulty;
        private Map<String, Object> metadata;
        private OffsetDateTime createdAt;

        public String getGameType() {
            return gameType;
        }

        public void setGameType(String gameType) {
            this.gameType = gameType;
        }

        public String getGameKey() {
            return gameKey;
        }

        public void setGameKey(String gameKey) {
            this.gameKey = gameKey;
        }

        public Integer getScore() {
            return score;
        }

        public void setScore(Integer score) {
            this.score = score;
        }

        public Integer getLevel() {
            return level;
        }

        public void setLevel(Integer level) {
            this.level = level;
        }

        public Integer getDuration() {
            return duration;
        }

        public void setDuration(Integer duration) {
            this.duration = duration;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public Map<String, Object> getMetadata() {
            return metadata;
        }

        public void setMetadata(Map<String, Object> metadata) {
            this.metadata = metadata;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }

    public static class FollowingLeaderboardRow {
        private Integer rank;
        private UUID userId;
        private String email;
        private String firstName;
        private String lastName;
        private Integer score;
        private Integer level;
        private Integer duration;
        private OffsetDateTime createdAt;

        public static FollowingLeaderboardRow from(GameScoreDto.FollowingLeaderboardResponse response) {
            FollowingLeaderboardRow row = new FollowingLeaderboardRow();
            row.rank = response.getRank();
            row.userId = response.getUserId();
            row.email = response.getEmail();
            row.firstName = response.getFirstName();
            row.lastName = response.getLastName();
            row.score = response.getScore();
            row.level = response.getLevel();
            row.duration = response.getDurationSec();
            row.createdAt = response.getPlayedAt();
            return row;
        }

        public Integer getRank() {
            return rank;
        }

        public void setRank(Integer rank) {
            this.rank = rank;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public Integer getScore() {
            return score;
        }

        public void setScore(Integer score) {
            this.score = score;
        }

        public Integer getLevel() {
            return level;
        }

        public void setLevel(Integer level) {
            this.level = level;
        }

        public Integer getDuration() {
            return duration;
        }

        public void setDuration(Integer duration) {
            this.duration = duration;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }

    public static class RankSummary {
        private String gameType;
        private Integer bestScore;
        private Integer globalRank;
        private Long globalPlayerCount;
        private Integer friendsRank;
        private Long friendsPlayerCount;

        public static RankSummary from(GameScoreDto.RankSummaryResponse response) {
            RankSummary summary = new RankSummary();
            summary.gameType = response.getGameKey();
            summary.bestScore = response.getBestScore();
            summary.globalRank = response.getGlobalRank();
            summary.globalPlayerCount = response.getGlobalPlayerCount();
            summary.friendsRank = response.getFriendsRank();
            summary.friendsPlayerCount = response.getFriendsPlayerCount();
            return summary;
        }

        public String getGameType() {
            return gameType;
        }

        public void setGameType(String gameType) {
            this.gameType = gameType;
        }

        public Integer getBestScore() {
            return bestScore;
        }

        public void setBestScore(Integer bestScore) {
            this.bestScore = bestScore;
        }

        public Integer getGlobalRank() {
            return globalRank;
        }

        public void setGlobalRank(Integer globalRank) {
            this.globalRank = globalRank;
        }

        public Long getGlobalPlayerCount() {
            return globalPlayerCount;
        }

        public void setGlobalPlayerCount(Long globalPlayerCount) {
            this.globalPlayerCount = globalPlayerCount;
        }

        public Integer getFriendsRank() {
            return friendsRank;
        }

        public void setFriendsRank(Integer friendsRank) {
            this.friendsRank = friendsRank;
        }

        public Long getFriendsPlayerCount() {
            return friendsPlayerCount;
        }

        public void setFriendsPlayerCount(Long friendsPlayerCount) {
            this.friendsPlayerCount = friendsPlayerCount;
        }
    }
}