package com.aiasistan.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

    private static final String UPLOAD_DIR = "uploads/profile-pictures/";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final int PROFILE_SIZE = 500;

    public ImageService() {
        createDirectory();
    }

    private void createDirectory() {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            throw new RuntimeException("Upload klasörü oluşturulamadı: " + UPLOAD_DIR, e);
        }
    }

    public String saveProfilePicture(MultipartFile file, UUID userId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Dosya boş veya null olamaz");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Dosya boyutu çok büyük. Maksimum: " + (MAX_FILE_SIZE / 1024 / 1024) + "MB"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Desteklenmeyen dosya tipi: " + contentType + ". İzin verilenler: " + ALLOWED_TYPES
            );
        }

        deleteOldProfilePictures(userId);

        BufferedImage originalImage;
        try (InputStream inputStream = file.getInputStream()) {
            originalImage = ImageIO.read(inputStream);
        }

        if (originalImage == null) {
            throw new IllegalArgumentException(
                    "Görsel okunamadı. Dosya bozuk veya desteklenmeyen format."
            );
        }

        String fileName = userId + "_" + System.currentTimeMillis() + ".jpg";
        Path targetPath = Paths.get(UPLOAD_DIR).resolve(fileName).normalize();

        BufferedImage resized = resizeAndCrop(originalImage, PROFILE_SIZE, PROFILE_SIZE);

        boolean written = ImageIO.write(resized, "jpg", targetPath.toFile());
        if (!written) {
            throw new IOException("Görsel JPG formatında yazılamadı: " + targetPath);
        }

        logger.info("Profil fotoğrafı kaydedildi: {} (userId={})", fileName, userId);

        return "/uploads/profile-pictures/" + fileName;
    }

    private void deleteOldProfilePictures(UUID userId) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            String prefix = userId.toString() + "_";
            Files.list(uploadPath)
                    .filter(p -> p.getFileName().toString().startsWith(prefix))
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                            logger.debug("Eski fotoğraf silindi: {}", p);
                        } catch (IOException e) {
                            logger.warn("Eski fotoğraf silinemedi: {}", p, e);
                        }
                    });
        } catch (IOException e) {
            logger.warn("Eski fotoğraflar listelenemedi, userId={}", userId, e);
        }
    }

    private BufferedImage resizeAndCrop(BufferedImage original, int targetWidth, int targetHeight) {
        int origWidth = original.getWidth();
        int origHeight = original.getHeight();

        double scale = Math.max(
                (double) targetWidth / origWidth,
                (double) targetHeight / origHeight
        );

        int scaledWidth = (int) Math.round(origWidth * scale);
        int scaledHeight = (int) Math.round(origHeight * scale);

        BufferedImage scaled = new BufferedImage(scaledWidth, scaledHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = scaled.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.drawImage(original, 0, 0, scaledWidth, scaledHeight, null);
        g2d.dispose();

        int x = (scaledWidth - targetWidth) / 2;
        int y = (scaledHeight - targetHeight) / 2;
        return scaled.getSubimage(x, y, targetWidth, targetHeight);
    }
}
