package com.aiasistan.repository;

import com.aiasistan.model.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {
    Page<Contact> findByUserIdOrderByNameAsc(UUID userId, Pageable pageable);
    Optional<Contact> findByIdAndUserId(UUID id, UUID userId);
}
