/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.aiasistan.exception.BadRequestException;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTemporaryPassword(String toEmail, String temporaryPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        if (fromAddress != null && !fromAddress.isBlank()) {
            message.setFrom(fromAddress);
        }
        message.setSubject("AI Asistan - Gecici Sifre");
        message.setText(
            "Merhaba,\n\n" +
            "Gecici sifreniz: " + temporaryPassword + "\n" +
            "Guvenlik icin giris yaptiktan sonra sifrenizi degistirin.\n\n" +
            "AI Asistan"
        );

        try {
            mailSender.send(message);
        } catch (MailAuthenticationException ex) {
            logger.error("SMTP authentication failed for {}", toEmail, ex);
            throw new BadRequestException(
                "SMTP kimlik dogrulama hatasi (535). Gmail icin 2 adimli dogrulama acik olmali ve yeni App Password kullanilmalidir."
            );
        } catch (MailException ex) {
            logger.error("Failed to send temporary password mail to {}", toEmail, ex);
            throw new BadRequestException("Sifre e-postasi gonderilemedi. Mail ayarlarinizi kontrol edin.");
        }
    }
}