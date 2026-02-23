/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.BlogPost;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

    Page<BlogPost> findByUserId(UUID userId, Pageable pageable);
    
    Page<BlogPost> findByUserIdAndStatusNot(UUID userId, String status, Pageable pageable);

    Optional<BlogPost> findByIdAndUserId(UUID id, UUID userId);

    Page<BlogPost> findByUserIdAndStatusAndVisibilityIn(UUID userId, String status, List<String> visibility, Pageable pageable);

    Page<BlogPost> findByUserIdInAndStatusAndVisibilityIn(List<UUID> userIds, String status, List<String> visibility, Pageable pageable);
}
