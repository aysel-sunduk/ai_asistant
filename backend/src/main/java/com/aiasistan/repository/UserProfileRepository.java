/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aiasistan.model.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    @Query(value = "SELECT * FROM user_profiles WHERE EXTRACT(MONTH FROM birth_date) = :month AND EXTRACT(DAY FROM birth_date) = :day", nativeQuery = true)
    List<UserProfile> findByBirthMonthAndDay(@Param("month") int month, @Param("day") int day);
}