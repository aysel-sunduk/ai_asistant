package com.aiasistan.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.InterviewQuestion;
import com.aiasistan.model.InterviewSession;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, UUID> {
    List<InterviewQuestion> findBySessionAndIsDeletedFalseOrderByOrderNoAsc(InterviewSession session);
}
