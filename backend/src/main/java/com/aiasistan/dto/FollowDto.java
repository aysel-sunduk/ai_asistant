package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class FollowDto {

    public static class UserSummary {
        private UUID userId;
        private String email;
        private String firstName;
        private String lastName;

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
    }

    public static class FollowResponse {
        private UserSummary user;
        private OffsetDateTime followedAt;

        public UserSummary getUser() {
            return user;
        }

        public void setUser(UserSummary user) {
            this.user = user;
        }

        public OffsetDateTime getFollowedAt() {
            return followedAt;
        }

        public void setFollowedAt(OffsetDateTime followedAt) {
            this.followedAt = followedAt;
        }
    }

    public static class StatsResponse {
        private long followingCount;
        private long followersCount;

        public long getFollowingCount() {
            return followingCount;
        }

        public void setFollowingCount(long followingCount) {
            this.followingCount = followingCount;
        }

        public long getFollowersCount() {
            return followersCount;
        }

        public void setFollowersCount(long followersCount) {
            this.followersCount = followersCount;
        }
    }

    public static class FollowStateResponse {
        private UUID targetUserId;
        private boolean following;

        public UUID getTargetUserId() {
            return targetUserId;
        }

        public void setTargetUserId(UUID targetUserId) {
            this.targetUserId = targetUserId;
        }

        public boolean isFollowing() {
            return following;
        }

        public void setFollowing(boolean following) {
            this.following = following;
        }
    }
}
