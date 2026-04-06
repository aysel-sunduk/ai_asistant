package com.aiasistan.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SttService {

    private static final Logger logger = LoggerFactory.getLogger(SttService.class);

    @Value("${app.ai.ml-service-url:${ML_SERVICE_URL:http://localhost:8000}}")
    private String mlServiceUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String transcribe(MultipartFile file) {
        String boundary = "Boundary-" + UUID.randomUUID().toString();

        try {
            byte[] fileBytes = file.getBytes();
            String fileName = file.getOriginalFilename();
            String contentType = file.getContentType();

            byte[] multipartBody = createMultipartBody(boundary, fileName, contentType, fileBytes);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/stt/transcribe"))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .timeout(Duration.ofMinutes(5))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                if (json.has("transcription")) {
                    return json.get("transcription").asText();
                }
            } else {
                logger.error("ML Service STT hatası ({}): {}", response.statusCode(), response.body());
            }

        } catch (Exception e) {
            logger.error("STT işlemi sırasında hata: {}", e.getMessage());
        }

        return null;
    }

    private byte[] createMultipartBody(String boundary, String fileName, String contentType, byte[] fileBytes)
            throws IOException {
        String linePrefix = "--" + boundary + "\r\n";
        String contentDisposition = "Content-Disposition: form-data; name=\"file\"; filename=\"" + fileName + "\"\r\n";
        String contentTypeLine = "Content-Type: " + contentType + "\r\n\r\n";
        String endLine = "\r\n--" + boundary + "--\r\n";

        byte[] prefix = (linePrefix + contentDisposition + contentTypeLine).getBytes();
        byte[] suffix = endLine.getBytes();

        byte[] body = new byte[prefix.length + fileBytes.length + suffix.length];
        System.arraycopy(prefix, 0, body, 0, prefix.length);
        System.arraycopy(fileBytes, 0, body, prefix.length, fileBytes.length);
        System.arraycopy(suffix, 0, body, prefix.length + fileBytes.length, suffix.length);

        return body;
    }
}
