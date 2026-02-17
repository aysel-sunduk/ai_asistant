package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import com.aiasistan.model.GameScore;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class GameScoreDto {

    public static class Request {
        @NotBlank(message = "Oyun anahtari bos olamaz")
        private String gameKey;

        @NotNull(message = "Skor zorunludur")
        @Min(value = 0, message = "Skor negatif olamaz")
        private Integer score;

        private String difficulty;

        @Min(value = 0, message = "Sure negatif olamaz")
        private Integer durationSec;

        private Map<String, Object> metadata;

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

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public Integer getDurationSec() {
            return durationSec;
        }

        public void setDurationSec(Integer durationSec) {
            this.durationSec = durationSec;
        }

        public Map<String, Object> getMetadata() {
            return metadata;
        }

        public void setMetadata(Map<String, Object> metadata) {
            this.metadata = metadata;
        }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private String gameKey;
        private Integer score;
        private String difficulty;
        private Integer durationSec;
        private Map<String, Object> metadata;
        private OffsetDateTime playedAt;

        public static Response from(GameScore score) {
            Response response = new Response();
            response.id = score.getId();
            response.userId = score.getUserId();
            response.gameKey = score.getGameKey();
            response.score = score.getScore();
            response.difficulty = score.getDifficulty();
            response.durationSec = score.getDurationSec();
            response.metadata = score.getMetadata();
            response.playedAt = score.getPlayedAt();
            return response;
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

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public Integer getDurationSec() {
            return durationSec;
        }

        public void setDurationSec(Integer durationSec) {
            this.durationSec = durationSec;
        }

        public Map<String, Object> getMetadata() {
            return metadata;
        }

        public void setMetadata(Map<String, Object> metadata) {
            this.metadata = metadata;
        }

        public OffsetDateTime getPlayedAt() {
            return playedAt;
        }

        public void setPlayedAt(OffsetDateTime playedAt) {
            this.playedAt = playedAt;
        }
    }

    public static class FollowingLeaderboardResponse {
        private int rank;
        private UUID userId;
        private String email;
        private String firstName;
        private String lastName;
        private Integer score;
        private String difficulty;
        private Integer durationSec;
        private OffsetDateTime playedAt;

        public int getRank() {
            return rank;
        }

        public void setRank(int rank) {
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

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public Integer getDurationSec() {
            return durationSec;
        }

        public void setDurationSec(Integer durationSec) {
            this.durationSec = durationSec;
        }

        public OffsetDateTime getPlayedAt() {
            return playedAt;
        }

        public void setPlayedAt(OffsetDateTime playedAt) {
            this.playedAt = playedAt;
        }
    }

    public static class RankSummaryResponse {
        private String gameKey;
        private Integer bestScore;
        private Integer globalRank;
        private Long globalPlayerCount;
        private Integer friendsRank;
        private Long friendsPlayerCount;

        public String getGameKey() {
            return gameKey;
        }

        public void setGameKey(String gameKey) {
            this.gameKey = gameKey;
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
