package com.aiasistan.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.InterviewSession;
import com.aiasistan.model.User;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    List<InterviewSession> findByUserOrderByCreatedAtDesc(User user);
}
