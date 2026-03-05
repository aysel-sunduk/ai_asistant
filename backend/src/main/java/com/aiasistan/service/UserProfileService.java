/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.request.ContactPrivacyUpdateRequest;
import com.aiasistan.dto.request.UserProfileUpsertRequest;
import com.aiasistan.dto.response.UserProfileResponse;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.User;
import com.aiasistan.model.UserProfile;
import com.aiasistan.repository.UserProfileRepository;
import com.aiasistan.repository.UserRepository;

@Service
public class UserProfileService {
    private static final Set<String> ALLOWED_PROFILE_VISIBILITY = Set.of("public", "private");

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileService(UserProfileRepository userProfileRepository, UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    /**
     * Kullanıcının profil tamamlanma durumunu modül bazında kontrol eder
     */
    @Transactional(readOnly = true)
    public Map<String, ModuleCompletionStatus> getModuleCompletionStatus(UUID userId) {
        UserProfile profile = getOrCreateProfile(userId);

        Map<String, ModuleCompletionStatus> status = new HashMap<>();

        status.put("work", checkWorkModule(profile));
        status.put("health", checkHealthModule(profile));
        status.put("finance", checkFinanceModule(profile));
        status.put("family", checkFamilyModule(profile));
        status.put("goals", checkGoalsModule(profile));

        return status;
    }

    private ModuleCompletionStatus checkWorkModule(UserProfile profile) {
        List<String> missing = new ArrayList<>();

        if (profile.getFullName() == null || profile.getFullName().isBlank()) {
            missing.add("full_name");
        }
        if (profile.getTimezone() == null) {
            missing.add("timezone");
        }

        return new ModuleCompletionStatus(missing.isEmpty(), missing);
    }

    private ModuleCompletionStatus checkHealthModule(UserProfile profile) {
        List<String> missing = new ArrayList<>();

        if (profile.getHeightCm() == null) {
            missing.add("height_cm");
        }
        if (profile.getWeightKg() == null) {
            missing.add("weight_kg");
        }
        if (profile.getBirthDate() == null) {
            missing.add("birth_date");
        }
        if (profile.getGender() == null || profile.getGender().isBlank()) {
            missing.add("gender");
        }
        if (profile.getActivityLevel() == null) {
            missing.add("activity_level");
        }

        return new ModuleCompletionStatus(missing.isEmpty(), missing);
    }

    private ModuleCompletionStatus checkFinanceModule(UserProfile profile) {
        List<String> missing = new ArrayList<>();

        if (profile.getPreferredCurrency() == null) {
            missing.add("preferred_currency");
        }
        if (profile.getMonthlyIncomeEstimateMinor() == null) {
            missing.add("monthly_income_estimate");
        }

        return new ModuleCompletionStatus(missing.isEmpty(), missing);
    }

    private ModuleCompletionStatus checkFamilyModule(UserProfile profile) {
        List<String> missing = new ArrayList<>();

        if (profile.getFullName() == null || profile.getFullName().isBlank()) {
            missing.add("full_name");
        }

        return new ModuleCompletionStatus(missing.isEmpty(), missing);
    }

    private ModuleCompletionStatus checkGoalsModule(UserProfile profile) {
        List<String> missing = new ArrayList<>();

        if (profile.getInterests() == null || profile.getInterests().isEmpty()) {
            missing.add("interests");
        }

        return new ModuleCompletionStatus(missing.isEmpty(), missing);
    }

    @Transactional
    public UserProfile getOrCreateProfile(UUID userId) {
        return userProfileRepository.findById(userId).orElseGet(() -> createDefaultProfile(userId));
    }

    @Transactional
    public UserProfileResponse upsertProfile(UUID userId, UserProfileUpsertRequest request) {
        UserProfile profile = getOrCreateProfile(userId);
        applyAllFields(profile, request);
        syncUsersTableColumns(profile);
        UserProfile saved = userProfileRepository.save(profile);
        return toResponse(saved);
    }

    @Transactional
    public UserProfileResponse upsertModuleProfile(UUID userId, String module, UserProfileUpsertRequest request) {
        UserProfile profile = getOrCreateProfile(userId);
        String normalized = module == null ? "" : module.toLowerCase(Locale.ROOT);

        switch (normalized) {
            case "work" -> applyWorkFields(profile, request);
            case "health" -> applyHealthFields(profile, request);
            case "finance" -> applyFinanceFields(profile, request);
            case "family" -> applyFamilyFields(profile, request);
            case "goals" -> applyGoalsFields(profile, request);
            default -> throw new BadRequestException("Unknown module: " + module);
        }

        syncUsersTableColumns(profile);
        UserProfile saved = userProfileRepository.save(profile);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        return toResponse(getOrCreateProfile(userId));
    }

    @Transactional
    public UserProfileResponse updateContactPrivacy(UUID userId, ContactPrivacyUpdateRequest request) {
        UserProfile profile = getOrCreateProfile(userId);

        profile.setShowPhone(request.getShowPhone());
        profile.setShowEmail(request.getShowEmail());

        UserProfile saved = userProfileRepository.save(profile);
        return toResponse(saved);
    }

    private UserProfile createDefaultProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Kullanici bulunamadi: " + userId));
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        return userProfileRepository.save(profile);
    }

    private void applyAllFields(UserProfile profile, UserProfileUpsertRequest request) {
        applyWorkFields(profile, request);
        applyHealthFields(profile, request);
        applyFinanceFields(profile, request);
        applyFamilyFields(profile, request);
        applyGoalsFields(profile, request);
        if (request.getOnboarding() != null) {
            profile.setOnboarding(request.getOnboarding());
        }
        if (request.getNotifications() != null) {
            profile.setNotifications(request.getNotifications());
        }
        if (request.getPhone() != null) {
            profile.setPhone(request.getPhone());
        }
        if (request.getShowPhone() != null) {
            profile.setShowPhone(request.getShowPhone());
        }
        if (request.getShowEmail() != null) {
            profile.setShowEmail(request.getShowEmail());
        }
    }

    private void applyWorkFields(UserProfile profile, UserProfileUpsertRequest request) {
        if (request.getFullName() != null)
            profile.setFullName(request.getFullName().trim());
        if (request.getTimezone() != null)
            profile.setTimezone(request.getTimezone());
        if (request.getLocale() != null)
            profile.setLocale(request.getLocale());
        if (request.getProfileVisibility() != null) {
            String normalized = normalizeProfileVisibility(request.getProfileVisibility());
            profile.setProfileVisibility(normalized);
        }
    }

    private void applyHealthFields(UserProfile profile, UserProfileUpsertRequest request) {
        if (request.getBirthDate() != null)
            profile.setBirthDate(request.getBirthDate());
        if (request.getGender() != null)
            profile.setGender(request.getGender());
        if (request.getHeightCm() != null)
            profile.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null)
            profile.setWeightKg(request.getWeightKg());
        if (request.getActivityLevel() != null)
            profile.setActivityLevel(request.getActivityLevel());
    }

    private void applyFinanceFields(UserProfile profile, UserProfileUpsertRequest request) {
        if (request.getPreferredCurrency() != null) {
            profile.setPreferredCurrency(normalizeCurrency(request.getPreferredCurrency()));
        }
        if (request.getMonthlyIncomeEstimateMinor() != null) {
            profile.setMonthlyIncomeEstimateMinor(request.getMonthlyIncomeEstimateMinor());
        }
    }

    private void applyFamilyFields(UserProfile profile, UserProfileUpsertRequest request) {
        if (request.getFullName() != null)
            profile.setFullName(request.getFullName().trim());
    }

    private void applyGoalsFields(UserProfile profile, UserProfileUpsertRequest request) {
        if (request.getInterests() != null)
            profile.setInterests(request.getInterests());
    }

    private UserProfileResponse toResponse(UserProfile profile) {
        User user = profile.getUser();
        if (user == null && profile.getUserId() != null) {
            user = userRepository.findById(profile.getUserId()).orElse(null);
        }

        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(profile.getUserId());
        if (user != null) {
            response.setEmail(user.getEmail());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            response.setProfileVisibility(normalizeProfileVisibility(user.getVisibility()));
        }
        response.setFullName(profile.getFullName());
        response.setBirthDate(profile.getBirthDate());
        response.setGender(profile.getGender());
        response.setTimezone(profile.getTimezone());
        response.setLocale(profile.getLocale());
        if (response.getProfileVisibility() == null) {
            response.setProfileVisibility(normalizeProfileVisibility(profile.getProfileVisibility()));
        }
        response.setHeightCm(profile.getHeightCm());
        response.setWeightKg(profile.getWeightKg());
        response.setPreferredCurrency(
                profile.getPreferredCurrency() != null ? normalizeCurrency(profile.getPreferredCurrency()) : null);
        response.setMonthlyIncomeEstimateMinor(profile.getMonthlyIncomeEstimateMinor());
        response.setInterests(profile.getInterests());
        response.setOnboarding(profile.getOnboarding());
        response.setNotifications(profile.getNotifications());
        response.setUpdatedAt(profile.getUpdatedAt());
        response.setPhone(profile.getPhone());
        response.setShowPhone(profile.isShowPhone());
        response.setShowEmail(profile.isShowEmail());
        response.setActivityLevel(profile.getActivityLevel());
        return response;
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "TRY";
        }
        String normalized = currency.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "TRY", "USD", "EUR", "GBP" -> normalized;
            default -> "TRY";
        };
    }

    private String normalizeProfileVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            return "public";
        }
        String normalized = visibility.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_PROFILE_VISIBILITY.contains(normalized)) {
            throw new BadRequestException("profileVisibility only accepts: public, private");
        }
        return normalized;
    }

    private void syncUsersTableColumns(UserProfile profile) {
        if (profile == null || profile.getUserId() == null) {
            return;
        }
        userRepository.findById(profile.getUserId()).ifPresent(user -> {
            user.setVisibility(normalizeProfileVisibility(profile.getProfileVisibility()));
            syncUserNameFromFullName(user, profile.getFullName());
        });
    }

    private void syncUserNameFromFullName(User user, String fullName) {
        if (user == null || fullName == null || fullName.isBlank()) {
            return;
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 0) {
            return;
        }
        String firstName = parts[0];
        String lastName = parts.length > 1
                ? String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length))
                : "";
        user.setFirstName(firstName);
        user.setLastName(lastName);
    }

    /**
     * Inner class - Modül tamamlanma durumu response'u
     */
    public static class ModuleCompletionStatus {
        private final boolean completed;
        private final List<String> missingFields;

        public ModuleCompletionStatus(boolean completed, List<String> missingFields) {
            this.completed = completed;
            this.missingFields = missingFields;
        }

        public boolean isCompleted() {
            return completed;
        }

        public List<String> getMissingFields() {
            return missingFields;
        }
    }
}