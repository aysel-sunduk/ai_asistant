/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aiasistan.model.HealthGoal;

public interface HealthGoalRepository extends JpaRepository<HealthGoal, UUID> {
}