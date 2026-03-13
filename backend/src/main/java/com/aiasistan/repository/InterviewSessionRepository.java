package com.aiasistan.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.InterviewSession;
import com.aiasistan.model.User;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    List<InterviewSession> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT s FROM InterviewSession s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    List<InterviewSession> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT s FROM InterviewSession s WHERE s.user.email = :email ORDER BY s.createdAt DESC")
    List<InterviewSession> findByUserEmailOrderByCreatedAtDesc(@Param("email") String email);
}
