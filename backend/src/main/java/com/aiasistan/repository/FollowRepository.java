/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.UUID;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.Follow;
import com.aiasistan.model.FollowId;

@Repository
public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    boolean existsByIdFollowerIdAndIdFollowingIdAndDeletedAtIsNull(UUID followerId, UUID followingId);

    Optional<Follow> findByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    Page<Follow> findByIdFollowerIdAndDeletedAtIsNull(UUID followerId, Pageable pageable);

    Page<Follow> findByIdFollowingIdAndDeletedAtIsNull(UUID followingId, Pageable pageable);

    long countByIdFollowerIdAndDeletedAtIsNull(UUID followerId);

    long countByIdFollowingIdAndDeletedAtIsNull(UUID followingId);
}
