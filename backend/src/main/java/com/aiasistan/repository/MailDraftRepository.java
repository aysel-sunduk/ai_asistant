package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.MailDraft;

@Repository
public interface MailDraftRepository extends JpaRepository<MailDraft, UUID> {

    Page<MailDraft> findByUserId(UUID userId, Pageable pageable);

    Optional<MailDraft> findByIdAndUserId(UUID id, UUID userId);
}
