package com.aiasistan.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.request.ForgotPasswordRequest;
import com.aiasistan.dto.request.LoginRequest;
import com.aiasistan.dto.request.RefreshTokenRequest;
import com.aiasistan.dto.request.RegisterRequest;
import com.aiasistan.dto.request.ChangePasswordRequest;
import com.aiasistan.dto.response.ChangePasswordResponse;
import com.aiasistan.dto.response.ForgotPasswordResponse;
import com.aiasistan.dto.response.LoginResponse;
import com.aiasistan.dto.response.LogoutResponse;
import com.aiasistan.dto.response.RefreshTokenResponse;
import com.aiasistan.dto.response.RegisterResponse;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.ConflictException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.RefreshToken;
import com.aiasistan.model.User;
import com.aiasistan.repository.RefreshTokenRepository;
import com.aiasistan.repository.UserRepository;
import com.aiasistan.security.JwtService;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final Pattern PASSWORD_POLICY = Pattern.compile("^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,128}$");

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        logger.info("Login attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.warn("Login failed - user not found: {}", request.getEmail());
                    return new NotFoundException("Kullanici bulunamadi!");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            logger.warn("Login failed - password mismatch for email: {}", request.getEmail());
            throw new BadRequestException("E-posta veya sifre hatali!");
        }

        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());
        Instant refreshTokenExpiry = jwtService.getExpiryInstant(refreshToken);

        refreshTokenRepository.revokeAllUserTokens(user.getId());

        RefreshToken savedRefreshToken = new RefreshToken(user, hashToken(refreshToken), refreshTokenExpiry);
        refreshTokenRepository.save(savedRefreshToken);

        logger.info("Login successful for email: {}", user.getEmail());
        return new LoginResponse(accessToken, refreshToken, user.getEmail());
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        logger.info("Registration attempt for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            logger.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new ConflictException("Bu e-posta adresi zaten kayitli!");
        }

        validatePasswordPolicy(request.getPassword());

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setFirstName(request.getFirstName().trim());
        newUser.setLastName(request.getLastName().trim());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setVisibility("public");
        newUser.setRole("user");

        User savedUser = userRepository.save(newUser);
        logger.info("User registered successfully with email: {}", savedUser.getEmail());

        return new RegisterResponse(savedUser.getEmail(), "Kullanici basariyla kaydedildi!");
    }

    @Transactional
    public ChangePasswordResponse changePassword(String userEmail, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new NotFoundException("Kullanici bulunamadi!"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mevcut sifre hatali");
        }

        validatePasswordPolicy(request.getNewPassword());
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Yeni sifre mevcut sifre ile ayni olamaz");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllUserTokens(user.getId());

        return new ChangePasswordResponse(user.getEmail(), "Sifre basariyla degistirildi");
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        logger.info("Forgot password attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("Kullanici bulunamadi!"));

        String temporaryPassword = generateNumericTemporaryPassword(6);
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        userRepository.save(user);
        refreshTokenRepository.revokeAllUserTokens(user.getId());
        emailService.sendTemporaryPassword(user.getEmail(), temporaryPassword);

        logger.info("Password updated successfully for email: {}", user.getEmail());
        return new ForgotPasswordResponse(user.getEmail(), "Gecici sifre e-posta adresinize gonderildi");
    }

    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        logger.debug("Refresh token attempt");

        if (!jwtService.isValid(request.getRefreshToken())) {
            logger.warn("Refresh token validation failed - token invalid or expired");
            throw new BadRequestException("Refresh token gecersiz veya suresi dolmus!");
        }

        String tokenHash = hashToken(request.getRefreshToken());
        RefreshToken storedToken = refreshTokenRepository.findByTokenHashAndIsRevokedFalse(tokenHash)
                .orElseThrow(() -> {
                    logger.warn("Refresh token not found or already revoked");
                    return new NotFoundException("Refresh token bulunamadi veya iptal edilmis!");
                });

        if (Instant.now().isAfter(storedToken.getExpiresAt())) {
            storedToken.setIsRevoked(true);
            refreshTokenRepository.save(storedToken);
            logger.warn("Refresh token has expired");
            throw new BadRequestException("Refresh token suresi dolmus!");
        }

        User user = storedToken.getUser();
        if (user == null) {
            throw new NotFoundException("Token ile iliskili kullanici bulunamadi!");
        }

        String userEmail = user.getEmail();
        String newAccessToken = jwtService.generateAccessToken(userEmail);
        String newRefreshToken = jwtService.generateRefreshToken(userEmail);
        Instant newRefreshTokenExpiry = jwtService.getExpiryInstant(newRefreshToken);

        storedToken.setIsRevoked(true);
        refreshTokenRepository.save(storedToken);

        RefreshToken newStoredToken = new RefreshToken(user, hashToken(newRefreshToken), newRefreshTokenExpiry);
        refreshTokenRepository.save(newStoredToken);

        logger.info("Token refreshed successfully for email: {}", userEmail);
        return new RefreshTokenResponse(newAccessToken, newRefreshToken);
    }

    @Transactional
    public LogoutResponse logout(String accessToken) {
        if (!jwtService.isValid(accessToken)) {
            throw new BadRequestException("Access token gecersiz!");
        }

        String email = jwtService.extractSubject(accessToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Kullanici bulunamadi!"));

        refreshTokenRepository.revokeAllUserTokens(user.getId());

        logger.info("User logged out successfully: {}", email);
        return new LogoutResponse("Basariyla cikis yapildi!");
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Hata: Token hash'lenemedi", e);
        }
    }

    private String generateNumericTemporaryPassword(int length) {
        final String digits = "0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder result = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            result.append(digits.charAt(random.nextInt(digits.length())));
        }
        return result.toString();
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || !PASSWORD_POLICY.matcher(password).matches()) {
            throw new BadRequestException("Sifre en az 6 karakter olmali, en az 1 buyuk harf ve 1 ozel karakter icermelidir");
        }
    }
}
