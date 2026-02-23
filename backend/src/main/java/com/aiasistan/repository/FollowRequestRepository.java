/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.FollowRequest;
import com.aiasistan.model.FollowRequestId;

@Repository
public interface FollowRequestRepository extends JpaRepository<FollowRequest, FollowRequestId> {

    Optional<FollowRequest> findByIdRequesterIdAndIdTargetId(UUID requesterId, UUID targetId);

    Page<FollowRequest> findByIdTargetIdAndStatus(UUID targetId, String status, Pageable pageable);

    Page<FollowRequest> findByIdRequesterIdAndStatus(UUID requesterId, String status, Pageable pageable);

    long countByIdTargetIdAndStatus(UUID targetId, String status);
}