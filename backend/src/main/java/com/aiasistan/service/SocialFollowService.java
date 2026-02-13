package com.aiasistan.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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
import com.aiasistan.model.User;
import com.aiasistan.repository.FollowRepository;
import com.aiasistan.repository.UserRepository;

@Service
public class SocialFollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public SocialFollowService(FollowRepository followRepository, UserRepository userRepository, UserService userService) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional
    public FollowDto.FollowStateResponse followUser(String userEmail, UUID targetUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, targetUserId);

        if (followRepository.existsByIdFollowerIdAndIdFollowingId(userId, targetUserId)) {
            return followState(targetUserId, true);
        }

        Follow follow = new Follow();
        follow.setId(new FollowId(userId, targetUserId));
        followRepository.save(follow);

        return followState(targetUserId, true);
    }

    @Transactional
    public FollowDto.FollowStateResponse unfollowUser(String userEmail, UUID targetUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTarget(userId, targetUserId);

        if (followRepository.existsByIdFollowerIdAndIdFollowingId(userId, targetUserId)) {
            followRepository.deleteByIdFollowerIdAndIdFollowingId(userId, targetUserId);
        }

        return followState(targetUserId, false);
    }

    @Transactional(readOnly = true)
    public FollowDto.FollowStateResponse getFollowState(String userEmail, UUID targetUserId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateTargetExists(targetUserId);

        boolean following = followRepository.existsByIdFollowerIdAndIdFollowingId(userId, targetUserId);
        return followState(targetUserId, following);
    }

    @Transactional(readOnly = true)
    public PageResponse<FollowDto.FollowResponse> getFollowing(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<Follow> page = followRepository.findByIdFollowerId(userId, pageable);

        List<UUID> followingIds = page.getContent().stream()
            .map(f -> f.getId().getFollowingId())
            .toList();

        Map<UUID, User> userMap = userRepository.findAllById(followingIds).stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

        List<FollowDto.FollowResponse> content = page.getContent().stream()
            .map(f -> toFollowResponseOrNull(userMap.get(f.getId().getFollowingId()), f))
            .filter(r -> r != null)
            .toList();

        Page<FollowDto.FollowResponse> mapped = new org.springframework.data.domain.PageImpl<>(
            content,
            pageable,
            content.size()
        );
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<FollowDto.FollowResponse> getFollowers(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<Follow> page = followRepository.findByIdFollowingId(userId, pageable);

        List<UUID> followerIds = page.getContent().stream()
            .map(f -> f.getId().getFollowerId())
            .toList();

        Map<UUID, User> userMap = userRepository.findAllById(followerIds).stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

        List<FollowDto.FollowResponse> content = page.getContent().stream()
            .map(f -> toFollowResponseOrNull(userMap.get(f.getId().getFollowerId()), f))
            .filter(r -> r != null)
            .toList();

        Page<FollowDto.FollowResponse> mapped = new org.springframework.data.domain.PageImpl<>(
            content,
            pageable,
            content.size()
        );
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public FollowDto.StatsResponse getStats(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        FollowDto.StatsResponse response = new FollowDto.StatsResponse();
        response.setFollowingCount(followRepository.countByIdFollowerId(userId));
        response.setFollowersCount(followRepository.countByIdFollowingId(userId));
        return response;
    }

    private FollowDto.FollowResponse toFollowResponseOrNull(User user, Follow follow) {
        if (user == null) {
            return null;
        }

        FollowDto.UserSummary summary = new FollowDto.UserSummary();
        summary.setUserId(user.getId());
        summary.setEmail(user.getEmail());
        summary.setFirstName(user.getFirstName());
        summary.setLastName(user.getLastName());

        FollowDto.FollowResponse response = new FollowDto.FollowResponse();
        response.setUser(summary);
        response.setFollowedAt(follow.getCreatedAt());
        return response;
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

    private FollowDto.FollowStateResponse followState(UUID targetUserId, boolean following) {
        FollowDto.FollowStateResponse response = new FollowDto.FollowStateResponse();
        response.setTargetUserId(targetUserId);
        response.setFollowing(following);
        return response;
    }
}
