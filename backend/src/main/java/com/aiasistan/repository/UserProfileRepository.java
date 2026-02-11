package com.aiasistan.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aiasistan.model.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
}