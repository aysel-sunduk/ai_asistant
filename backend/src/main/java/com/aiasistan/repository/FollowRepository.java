/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.Follow;
import com.aiasistan.model.FollowId;

@Repository
public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    boolean existsByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    void deleteByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    Page<Follow> findByIdFollowerId(UUID followerId, Pageable pageable);

    Page<Follow> findByIdFollowingId(UUID followingId, Pageable pageable);

    long countByIdFollowerId(UUID followerId);

    long countByIdFollowingId(UUID followingId);
}