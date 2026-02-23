/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.User;
import com.aiasistan.repository.UserProfileRepository;
import com.aiasistan.repository.UserRepository;

@Service
public class UserService {

    private static final Set<String> ALLOWED_VISIBILITY = Set.of("public", "private");

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public UUID getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
            .map(User::getId)
            .orElseThrow(() -> new NotFoundException("Kullanici bulunamadi: " + email));
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("Kullanici bulunamadi: " + email));
    }

    @Transactional
    public User updateVisibilityByEmail(String email, String visibility) {
        User user = getUserByEmail(email);
        String normalized = normalizeVisibility(visibility);
        user.setVisibility(normalized);
        userProfileRepository.findById(user.getId()).ifPresent(profile -> profile.setProfileVisibility(normalized));
        return userRepository.save(user);
    }

    public String normalizeVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            throw new BadRequestException("visibility zorunludur");
        }
        String normalized = visibility.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_VISIBILITY.contains(normalized)) {
            throw new BadRequestException("visibility only accepts: public, private");
        }
        return normalized;
    }
}