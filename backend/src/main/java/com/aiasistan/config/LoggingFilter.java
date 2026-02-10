package com.aiasistan.config;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

/**
 * Tüm HTTP istekleri ve cevaplarını loglar.
 * Şifreleri maskeler, authorization header'ını gizler.
 * Audit trail için detaylı bilgi tutar.
 */
@Component
public class LoggingFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
    private static final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        // Request body'yi cache'le (sadece bir kez oku)
        CachedBodyHttpServletRequest wrappedRequest = new CachedBodyHttpServletRequest(request);
        String requestBody = new String(wrappedRequest.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        requestBody = maskSensitiveData(requestBody);
        
        // Response body'yi cache'le
        CachedBodyHttpServletResponse wrappedResponse = new CachedBodyHttpServletResponse(response);
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Filter chain'i çalıştır
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            // Writer'ı flush et ve close et
            if (wrappedResponse.writer != null) {
                wrappedResponse.writer.flush();
                wrappedResponse.writer.close();
            }
            
            // OutputStream'i flush et
            if (wrappedResponse.outputStream != null) {
                wrappedResponse.outputStream.flush();
            }
            
            // Response body'yi al
            String responseBody = new String(wrappedResponse.getContentAsByteArray(), StandardCharsets.UTF_8);
            responseBody = maskSensitiveData(responseBody);
            
            // Authenticated user al
            String userEmail = "ANONYMOUS";
            try {
                Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                if (principal != null && principal.toString() != null && !principal.toString().equals("anonymousUser")) {
                    userEmail = principal.toString();
                }
            } catch (Exception e) {
                // Auth olmayan işlemler için ANONYMOUS kalacak
            }
            
            // Log message oluştur
            logRequest(request, response, wrappedResponse, requestBody, responseBody, duration, userEmail);
            
            // Response'u client'e gönder
            try {
                byte[] content = wrappedResponse.getContentAsByteArray();
                response.setContentLength(content.length);
                response.getOutputStream().write(content);
                response.getOutputStream().flush();
            } catch (IOException e) {
                logger.error("Error writing response to client", e);
            }
        }
    }

    /**
     * Şifre, token ve diğer sensitif veriler maskele.
     */
    private String maskSensitiveData(String data) {
        if (data == null || data.isEmpty()) {
            return data;
        }
        
        // Password maskele: "password":"..." -> "password":"*****"
        data = data.replaceAll(
            "(\"password\"\\s*:\\s*\")[^\"]*\"",
            "$1*****\""
        );
        
        // refreshToken maskele
        data = data.replaceAll(
            "(\"refreshToken\"\\s*:\\s*\")[^\"]*\"",
            "$1*****\""
        );
        
        // accessToken maskele
        data = data.replaceAll(
            "(\"accessToken\"\\s*:\\s*\")[^\"]*\"",
            "$1*****\""
        );
        
        // token maskele (genel)
        data = data.replaceAll(
            "(\"token\"\\s*:\\s*\")[^\"]*\"",
            "$1*****\""
        );
        
        return data;
    }

    /**
     * Log message'ı oluştur ve yaz.
     */
    private void logRequest(HttpServletRequest request, HttpServletResponse response,
                           CachedBodyHttpServletResponse wrappedResponse, String requestBody,
                           String responseBody, long duration, String userEmail) {
        
        String uri = request.getRequestURI();
        String method = request.getMethod();
        int status = wrappedResponse.getStatus();
        
        String logMessage = String.format(
            "[%s] %s %s | Status: %d | User: %s | Duration: %dms",
            dateFormatter.format(LocalDateTime.now()),
            method,
            uri,
            status,
            userEmail,
            duration
        );
        
        // HTTP status koduna göre log level seç
        if (status >= 500) {
            logger.error(logMessage);
            if (!requestBody.isEmpty()) {
                logger.error("Request Body: {}", requestBody);
            }
            if (!responseBody.isEmpty()) {
                logger.error("Response Body: {}", responseBody);
            }
        } else if (status >= 400) {
            logger.warn(logMessage);
            if (!requestBody.isEmpty()) {
                logger.debug("Request Body: {}", requestBody);
            }
            if (!responseBody.isEmpty()) {
                logger.debug("Response Body: {}", responseBody);
            }
        } else {
            logger.info(logMessage);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        // Swagger ve diğer public endpointler için logging devre dışı bırak (isteğe bağlı)
        return path.startsWith("/swagger-ui") || 
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/favicon.ico");
    }

    /**
     * Request wrapper - body'yi cache'ler
     */
    public static class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
        private byte[] cachedBody;

        public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
            super(request);
            InputStream requestInputStream = request.getInputStream();
            this.cachedBody = requestInputStream.readAllBytes();
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(this.cachedBody);
            return new ServletInputStream() {
                @Override
                public int read() throws IOException {
                    return byteArrayInputStream.read();
                }

                @Override
                public boolean isFinished() {
                    return byteArrayInputStream.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener listener) {
                }
            };
        }

        @Override
        public BufferedReader getReader() throws IOException {
            return new BufferedReader(new InputStreamReader(this.getInputStream()));
        }
    }

    /**
     * Response wrapper - body'yi cache'ler
     */
    public static class CachedBodyHttpServletResponse extends HttpServletResponseWrapper {
        private ByteArrayOutputStream baos = new ByteArrayOutputStream();
        public ServletOutputStream outputStream;
        public PrintWriter writer;

        public CachedBodyHttpServletResponse(HttpServletResponse response) {
            super(response);
        }

        @Override
        public ServletOutputStream getOutputStream() throws IOException {
            if (this.outputStream == null) {
                this.outputStream = new ServletOutputStream() {
                    @Override
                    public void write(int b) throws IOException {
                        baos.write(b);
                    }

                    @Override
                    public boolean isReady() {
                        return true;
                    }

                    @Override
                    public void setWriteListener(WriteListener listener) {
                    }
                };
            }
            return this.outputStream;
        }

        @Override
        public PrintWriter getWriter() throws IOException {
            if (this.writer == null) {
                this.writer = new PrintWriter(
                    new OutputStreamWriter(baos, getCharacterEncoding()), true
                );
            }
            return this.writer;
        }

        public byte[] getContentAsByteArray() {
            return baos.toByteArray();
        }
    }
}
