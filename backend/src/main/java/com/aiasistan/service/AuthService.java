package com.aiasistan.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.request.LoginRequest;
import com.aiasistan.dto.request.RefreshTokenRequest;
import com.aiasistan.dto.request.RegisterRequest;
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

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, 
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, 
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        logger.info("Login attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.warn("Login failed - user not found: {}", request.getEmail());
                    return new NotFoundException("Kullanıcı bulunamadı!");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            logger.warn("Login failed - password mismatch for email: {}", request.getEmail());
            throw new BadRequestException("E-posta veya şifre hatalı!");
        }

        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());
        Instant refreshTokenExpiry = jwtService.getExpiryInstant(refreshToken);
        
        // Önemli: Yeni login'de eski tokenları temizlemek iyi bir pratiktir
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
            throw new ConflictException("Bu e-posta adresi zaten kayıtlı!");
        }

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setRole("user");

        User savedUser = userRepository.save(newUser);
        logger.info("User registered successfully with email: {}", savedUser.getEmail());

        return new RegisterResponse(savedUser.getEmail(), "Kullanıcı başarıyla kaydedildi!");
    }

    // KRİTİK DÜZELTME: @Transactional eklendi. 
    // Bu sayede storedToken.getUser() çağrıldığında DB session açık kalır.
    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        logger.debug("Refresh token attempt");

        // 1. JWT format/imza kontrolü
        if (!jwtService.isValid(request.getRefreshToken())) {
            logger.warn("Refresh token validation failed - token invalid or expired");
            throw new BadRequestException("Refresh token geçersiz veya süresi dolmuş!");
        }

        // 2. DB'de token hash kontrolü
        String tokenHash = hashToken(request.getRefreshToken());
        RefreshToken storedToken = refreshTokenRepository.findByTokenHashAndIsRevokedFalse(tokenHash)
                .orElseThrow(() -> {
                    logger.warn("Refresh token not found or already revoked");
                    return new NotFoundException("Refresh token bulunamadı veya iptal edilmiş!");
                });

        // 3. Süre kontrolü
        if (Instant.now().isAfter(storedToken.getExpiresAt())) {
            storedToken.setIsRevoked(true); // Süresi dolmuşsa revoke et
            refreshTokenRepository.save(storedToken);
            logger.warn("Refresh token has expired");
            throw new BadRequestException("Refresh token süresi dolmuş!");
        }

        // 4. Kullanıcı erişimi (Proxy hatası burada çözüldü)
        User user = storedToken.getUser();
        if (user == null) {
            throw new NotFoundException("Token ile ilişkili kullanıcı bulunamadı!");
        }

        // 5. Yeni tokenların üretilmesi
        String userEmail = user.getEmail(); // Session açık olduğu için hata vermez
        String newAccessToken = jwtService.generateAccessToken(userEmail);
        String newRefreshToken = jwtService.generateRefreshToken(userEmail);
        Instant newRefreshTokenExpiry = jwtService.getExpiryInstant(newRefreshToken);
        
        // 6. Eski tokenı iptal et (Rotate işlemi)
        storedToken.setIsRevoked(true);
        refreshTokenRepository.save(storedToken);
        
        // 7. Yeni refresh token'ı kaydet
        RefreshToken newStoredToken = new RefreshToken(user, hashToken(newRefreshToken), newRefreshTokenExpiry);
        refreshTokenRepository.save(newStoredToken);
        
        logger.info("Token refreshed successfully for email: {}", userEmail);
        return new RefreshTokenResponse(newAccessToken, newRefreshToken);
    }

    @Transactional
    public LogoutResponse logout(String accessToken) {
        if (!jwtService.isValid(accessToken)) {
            throw new BadRequestException("Access token geçersiz!");
        }

        String email = jwtService.extractSubject(accessToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı!"));

        refreshTokenRepository.revokeAllUserTokens(user.getId());
        
        logger.info("User logged out successfully: {}", email);
        return new LogoutResponse("Başarıyla çıkış yapıldı!");
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Hata: Token hash'lenemedi", e);
        }
    }
}