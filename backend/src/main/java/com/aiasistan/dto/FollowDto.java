/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO: Takip (follow) ilişkisi verileri.
 */
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
        private String relationStatus;

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

        public String getRelationStatus() {
            return relationStatus;
        }

        public void setRelationStatus(String relationStatus) {
            this.relationStatus = relationStatus;
        }
    }

    public static class DiscoverUserResponse {
        private UserSummary user;
        private boolean following;
        private String relationStatus;
        private boolean privateProfile;

        public UserSummary getUser() {
            return user;
        }

        public void setUser(UserSummary user) {
            this.user = user;
        }

        public boolean isFollowing() {
            return following;
        }

        public void setFollowing(boolean following) {
            this.following = following;
        }

        public String getRelationStatus() {
            return relationStatus;
        }

        public void setRelationStatus(String relationStatus) {
            this.relationStatus = relationStatus;
        }

        public boolean isPrivateProfile() {
            return privateProfile;
        }

        public void setPrivateProfile(boolean privateProfile) {
            this.privateProfile = privateProfile;
        }
    }

    public static class FollowRequestResponse {
        private UserSummary user;
        private String status;
        private OffsetDateTime requestedAt;
        private OffsetDateTime updatedAt;

        public UserSummary getUser() {
            return user;
        }

        public void setUser(UserSummary user) {
            this.user = user;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public OffsetDateTime getRequestedAt() {
            return requestedAt;
        }

        public void setRequestedAt(OffsetDateTime requestedAt) {
            this.requestedAt = requestedAt;
        }

        public OffsetDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(OffsetDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    public static class RequestStatsResponse {
        private long incomingPendingCount;

        public long getIncomingPendingCount() {
            return incomingPendingCount;
        }

        public void setIncomingPendingCount(long incomingPendingCount) {
            this.incomingPendingCount = incomingPendingCount;
        }
    }

    public static class PublicProfileResponse {
        private UUID userId;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private long followingCount;
        private long followersCount;
        private String profileVisibility;

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
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

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

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

        public String getProfileVisibility() {
            return profileVisibility;
        }

        public void setProfileVisibility(String profileVisibility) {
            this.profileVisibility = profileVisibility;
        }
    }
}