/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Arrays;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.FollowDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.Follow;
import com.aiasistan.model.FollowId;
import com.aiasistan.model.FollowRequest;
import com.aiasistan.model.FollowRequestId;
import com.aiasistan.model.User;
import com.aiasistan.repository.FollowRequestRepository;
import com.aiasistan.repository.FollowRepository;
import com.aiasistan.repository.UserProfileRepository;
import com.aiasistan.repository.UserRepository;

@Service
public class SocialFollowService {

    private static final String PRIVATE = "private";
    private static final String REQUEST_PENDING = "pending";
    private static final String REQUEST_ACCEPTED = "accepted";
    private static final String REQUEST_REJECTED = "rejected";
    private static final String REQUEST_CANCELLED = "cancelled";

    private final FollowRepository followRepository;
    private final FollowRequestRepository followRequestRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserService userService;
    private final PushNotificationService pushNotificationService;

    public SocialFollowService(
            FollowRepository followRepository,
            FollowRequestRepository followRequestRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            UserService userService,
            PushNotificationService pushNotificationService) {
        this.followRepository = followRepository;
        this.followRequestRepository = followRequestRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userService = userService;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional
    public FollowDto.FollowStateResponse followUser(String userEmail, UUID targetUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, targetUserId);

        if (followRepository.existsByIdFollowerIdAndIdFollowingIdAndDeletedAtIsNull(userId, targetUserId)) {
            return followState(targetUserId, true, "following");
        }

        if (isPrivateProfile(targetUserId)) {
            boolean pendingBefore = hasPendingRequest(userId, targetUserId);
            upsertFollowRequest(userId, targetUserId, REQUEST_PENDING);
            if (!pendingBefore) {
                pushNotificationService.sendFollowRequestNotification(targetUserId, userId);
            }
            return followState(targetUserId, false, "pending_outgoing");
        }

        Follow follow = followRepository.findByIdFollowerIdAndIdFollowingId(userId, targetUserId).orElseGet(Follow::new);
        follow.setId(new FollowId(userId, targetUserId));
        follow.setDeletedAt(null);
        followRepository.save(follow);
        upsertFollowRequest(userId, targetUserId, REQUEST_ACCEPTED);

        return followState(targetUserId, true, "following");
    }

    @Transactional
    public FollowDto.FollowStateResponse unfollowUser(String userEmail, UUID targetUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, targetUserId);

        followRepository.findByIdFollowerIdAndIdFollowingId(userId, targetUserId).ifPresent(follow -> {
            follow.setDeletedAt(OffsetDateTime.now());
            followRepository.save(follow);
        });
        followRequestRepository.findByIdRequesterIdAndIdTargetId(userId, targetUserId)
                .filter(r -> REQUEST_PENDING.equals(r.getStatus()))
                .ifPresent(r -> {
                    r.setStatus(REQUEST_CANCELLED);
                    followRequestRepository.save(r);
                });

        return followState(targetUserId, false, "not_following");
    }

    @Transactional(readOnly = true)
    public FollowDto.FollowStateResponse getFollowState(String userEmail, UUID targetUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, targetUserId);

        if (followRepository.existsByIdFollowerIdAndIdFollowingIdAndDeletedAtIsNull(userId, targetUserId)) {
            return followState(targetUserId, true, "following");
        }

        if (hasPendingRequest(userId, targetUserId)) {
            return followState(targetUserId, false, "pending_outgoing");
        }

        if (hasPendingRequest(targetUserId, userId)) {
            return followState(targetUserId, false, "pending_incoming");
        }

        return followState(targetUserId, false, "not_following");
    }

    @Transactional(readOnly = true)
    public PageResponse<FollowDto.FollowResponse> getFollowing(String userEmail, Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable zorunludur");
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<Follow> page = followRepository.findByIdFollowerIdAndDeletedAtIsNull(userId, safePageable);

        List<UUID> followingIds = page.getContent().stream()
                .map(f -> f.getId().getFollowingId())
                .toList();

        Map<UUID, User> userMap = userRepository.findAllById(followingIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<FollowDto.FollowResponse> content = page.getContent().stream()
                .map(f -> toFollowResponseOrNull(userMap.get(f.getId().getFollowingId()), f))
                .filter(Objects::nonNull)
                .toList();

        Page<FollowDto.FollowResponse> mapped = new org.springframework.data.domain.PageImpl<>(
                content,
                safePageable,
                page.getTotalElements());
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<FollowDto.FollowResponse> getFollowers(String userEmail, Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable zorunludur");
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<Follow> page = followRepository.findByIdFollowingIdAndDeletedAtIsNull(userId, safePageable);

        List<UUID> followerIds = page.getContent().stream()
                .map(f -> f.getId().getFollowerId())
                .toList();

        Map<UUID, User> userMap = userRepository.findAllById(followerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<FollowDto.FollowResponse> content = page.getContent().stream()
                .map(f -> toFollowResponseOrNull(userMap.get(f.getId().getFollowerId()), f))
                .filter(Objects::nonNull)
                .toList();

        Page<FollowDto.FollowResponse> mapped = new org.springframework.data.domain.PageImpl<>(
                content,
                safePageable,
                page.getTotalElements());
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public FollowDto.StatsResponse getStats(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        FollowDto.StatsResponse response = new FollowDto.StatsResponse();
        response.setFollowingCount(followRepository.countByIdFollowerIdAndDeletedAtIsNull(userId));
        response.setFollowersCount(followRepository.countByIdFollowingIdAndDeletedAtIsNull(userId));
        return response;
    }

    @Transactional
    public FollowDto.FollowStateResponse acceptFollowRequest(String userEmail, UUID requesterUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, requesterUserId);

        FollowRequest request = followRequestRepository
                .findByIdRequesterIdAndIdTargetId(requesterUserId, userId)
                .orElseThrow(() -> new NotFoundException("Takip istegi bulunamadi"));

        if (!REQUEST_PENDING.equals(request.getStatus())) {
            throw new BadRequestException("Sadece bekleyen istek kabul edilebilir");
        }

        request.setStatus(REQUEST_ACCEPTED);
        followRequestRepository.save(request);

        if (!followRepository.existsByIdFollowerIdAndIdFollowingIdAndDeletedAtIsNull(requesterUserId, userId)) {
            Follow follow = followRepository.findByIdFollowerIdAndIdFollowingId(requesterUserId, userId).orElseGet(Follow::new);
            follow.setId(new FollowId(requesterUserId, userId));
            follow.setDeletedAt(null);
            followRepository.save(follow);
        }

        return followState(requesterUserId, true, "following");
    }

    @Transactional
    public FollowDto.FollowStateResponse rejectFollowRequest(String userEmail, UUID requesterUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, requesterUserId);

        FollowRequest request = followRequestRepository
                .findByIdRequesterIdAndIdTargetId(requesterUserId, userId)
                .orElseThrow(() -> new NotFoundException("Takip istegi bulunamadi"));

        if (!REQUEST_PENDING.equals(request.getStatus())) {
            throw new BadRequestException("Sadece bekleyen istek reddedilebilir");
        }

        request.setStatus(REQUEST_REJECTED);
        followRequestRepository.save(request);
        return followState(requesterUserId, false, "rejected");
    }

    @Transactional(readOnly = true)
    public PageResponse<FollowDto.FollowRequestResponse> getIncomingRequests(String userEmail, Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable zorunludur");
        UUID userId = userService.getUserIdByEmail(userEmail);

        Page<FollowRequest> page = followRequestRepository.findByIdTargetIdAndStatus(userId, REQUEST_PENDING,
                safePageable);
        List<UUID> requesterIds = page.getContent().stream().map(r -> r.getId().getRequesterId()).toList();
        Map<UUID, User> userMap = userRepository.findAllById(requesterIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<FollowDto.FollowRequestResponse> content = page.getContent().stream()
                .map(r -> toFollowRequestResponseOrNull(userMap.get(r.getId().getRequesterId()), r))
                .filter(Objects::nonNull)
                .toList();

        Page<FollowDto.FollowRequestResponse> mapped = new org.springframework.data.domain.PageImpl<>(
                content,
                safePageable,
                page.getTotalElements());
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<FollowDto.FollowRequestResponse> getOutgoingRequests(String userEmail, Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable zorunludur");
        UUID userId = userService.getUserIdByEmail(userEmail);

        Page<FollowRequest> page = followRequestRepository.findByIdRequesterIdAndStatus(userId, REQUEST_PENDING,
                safePageable);
        List<UUID> targetIds = page.getContent().stream().map(r -> r.getId().getTargetId()).toList();
        Map<UUID, User> userMap = userRepository.findAllById(targetIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<FollowDto.FollowRequestResponse> content = page.getContent().stream()
                .map(r -> toFollowRequestResponseOrNull(userMap.get(r.getId().getTargetId()), r))
                .filter(Objects::nonNull)
                .toList();

        Page<FollowDto.FollowRequestResponse> mapped = new org.springframework.data.domain.PageImpl<>(
                content,
                safePageable,
                page.getTotalElements());
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<FollowDto.DiscoverUserResponse> getDiscoverUsers(String userEmail, String q,
            Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable zorunludur");
        UUID userId = userService.getUserIdByEmail(userEmail);

        String normalizedQ = q == null ? null : q.trim();
        Page<User> page;
        if (normalizedQ == null || normalizedQ.isBlank()) {
            page = userRepository.findByIdNotAndIsActiveTrueAndDeletedAtIsNullAndVisibilityIn(
                    userId,
                    Arrays.asList("public", "private"),
                    safePageable);
        } else {
            page = userRepository.findDiscoverablePublicUsers(userId, normalizedQ, safePageable);
        }
        Page<FollowDto.DiscoverUserResponse> mapped = page.map(target -> {
            FollowDto.DiscoverUserResponse response = new FollowDto.DiscoverUserResponse();
            response.setUser(toUserSummary(target));

            boolean following = followRepository.existsByIdFollowerIdAndIdFollowingIdAndDeletedAtIsNull(userId, target.getId());
            response.setFollowing(following);
            response.setRelationStatus(resolveRelationStatus(userId, target.getId(), following));
            response.setPrivateProfile(PRIVATE.equalsIgnoreCase(target.getVisibility()));
            return response;
        });
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public FollowDto.RequestStatsResponse getRequestStats(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FollowDto.RequestStatsResponse response = new FollowDto.RequestStatsResponse();
        response.setIncomingPendingCount(followRequestRepository.countByIdTargetIdAndStatus(userId, REQUEST_PENDING));
        return response;
    }

    @Transactional
    public FollowDto.FollowStateResponse withdrawFollowRequest(String userEmail, UUID targetUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, targetUserId);

        FollowRequest request = followRequestRepository
                .findByIdRequesterIdAndIdTargetId(userId, targetUserId)
                .orElseThrow(() -> new NotFoundException("Geri cekilecek takip istegi bulunamadi"));

        if (!REQUEST_PENDING.equals(request.getStatus())) {
            throw new BadRequestException("Sadece bekleyen takip istegi geri cekilebilir");
        }

        request.setStatus(REQUEST_CANCELLED);
        followRequestRepository.save(request);
        return followState(targetUserId, false, "not_following");
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(UUID followerId, UUID followingId) {
        return followRepository.existsByIdFollowerIdAndIdFollowingIdAndDeletedAtIsNull(followerId, followingId);
    }

    @Transactional(readOnly = true)
    public List<UUID> getFollowingUserIds(UUID userId) {
        return followRepository.findByIdFollowerIdAndDeletedAtIsNull(userId, Pageable.unpaged()).getContent().stream()
                .map(f -> f.getId().getFollowingId())
                .toList();
    }

    private FollowDto.FollowResponse toFollowResponseOrNull(User user, Follow follow) {
        if (user == null) {
            return null;
        }

        FollowDto.UserSummary summary = toUserSummary(user);
        FollowDto.FollowResponse response = new FollowDto.FollowResponse();
        response.setUser(summary);
        response.setFollowedAt(follow.getCreatedAt());
        return response;
    }

    private FollowDto.FollowRequestResponse toFollowRequestResponseOrNull(User user, FollowRequest request) {
        if (user == null) {
            return null;
        }

        FollowDto.FollowRequestResponse response = new FollowDto.FollowRequestResponse();
        response.setUser(toUserSummary(user));
        response.setStatus(request.getStatus());
        response.setRequestedAt(request.getCreatedAt());
        response.setUpdatedAt(request.getUpdatedAt());
        return response;
    }

    private FollowDto.UserSummary toUserSummary(User user) {
        FollowDto.UserSummary summary = new FollowDto.UserSummary();
        summary.setUserId(user.getId());
        summary.setEmail(user.getEmail());
        summary.setFirstName(user.getFirstName());
        summary.setLastName(user.getLastName());
        return summary;
    }

    private void validateTarget(UUID userId, UUID targetUserId) {
        if (targetUserId == null) {
            throw new BadRequestException("Hedef kullanici id zorunludur");
        }
        if (userId.equals(targetUserId)) {
            throw new BadRequestException("Kullanici kendini takip edemez");
        }
        validateTargetExists(targetUserId);
    }

    private void validateTargetExists(UUID targetUserId) {
        if (!userRepository.existsById(targetUserId)) {
            throw new NotFoundException("Takip edilecek kullanici bulunamadi");
        }
    }

    private boolean isPrivateProfile(UUID userId) {
        return userRepository.findById(userId)
                .map(User::getVisibility)
                .map(v -> v != null && PRIVATE.equalsIgnoreCase(v))
                .orElse(false);
    }

    private void upsertFollowRequest(UUID requesterId, UUID targetId, String status) {
        FollowRequest request = followRequestRepository
                .findByIdRequesterIdAndIdTargetId(requesterId, targetId)
                .orElseGet(() -> {
                    FollowRequest r = new FollowRequest();
                    r.setId(new FollowRequestId(requesterId, targetId));
                    return r;
                });
        request.setStatus(status);
        followRequestRepository.save(request);
    }

    private boolean hasPendingRequest(UUID requesterId, UUID targetId) {
        return followRequestRepository.findByIdRequesterIdAndIdTargetId(requesterId, targetId)
                .map(r -> REQUEST_PENDING.equals(r.getStatus()))
                .orElse(false);
    }

    private FollowDto.FollowStateResponse followState(UUID targetUserId, boolean following, String relationStatus) {
        FollowDto.FollowStateResponse response = new FollowDto.FollowStateResponse();
        response.setTargetUserId(targetUserId);
        response.setFollowing(following);
        response.setRelationStatus(relationStatus);
        return response;
    }

    private String resolveRelationStatus(UUID userId, UUID targetUserId, boolean following) {
        if (following) {
            return "following";
        }
        if (hasPendingRequest(userId, targetUserId)) {
            return "pending_outgoing";
        }
        if (hasPendingRequest(targetUserId, userId)) {
            return "pending_incoming";
        }
        return "not_following";
    }

    @Transactional(readOnly = true)
    public FollowDto.PublicProfileResponse getPublicProfile(UUID targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        FollowDto.PublicProfileResponse response = new FollowDto.PublicProfileResponse();
        response.setUserId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setFollowingCount(followRepository.countByIdFollowerIdAndDeletedAtIsNull(targetUserId));
        response.setFollowersCount(followRepository.countByIdFollowingIdAndDeletedAtIsNull(targetUserId));
        response.setProfileVisibility(user.getVisibility() != null ? user.getVisibility() : "public");

        // Respect phone/email visibility settings
        userProfileRepository.findById(targetUserId).ifPresent(profile -> {
            if (profile.isShowEmail()) {
                response.setEmail(user.getEmail());
            }
            if (profile.isShowPhone()) {
                response.setPhone(profile.getPhone());
            }
        });

        return response;
    }
}
