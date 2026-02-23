/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import com.aiasistan.model.FamilyBirthday;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyBirthdayRepository extends JpaRepository<FamilyBirthday, UUID> {

    Page<FamilyBirthday> findByUserIdOrderByBirthDateAsc(UUID userId, Pageable pageable);

    Optional<FamilyBirthday> findByIdAndUserId(UUID id, UUID userId);
}