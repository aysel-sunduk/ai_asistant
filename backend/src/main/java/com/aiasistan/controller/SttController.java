package com.aiasistan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.aiasistan.service.SttService;

import java.util.Map;

@RestController
@RequestMapping("/api/stt")
public class SttController {

    private final SttService sttService;

    public SttController(SttService sttService) {
        this.sttService = sttService;
    }

    @PostMapping("/transcribe")
    public ResponseEntity<Map<String, String>> transcribe(@RequestParam("file") MultipartFile file) {
        String transcription = sttService.transcribe(file);
        if (transcription == null) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Ses dökümü yapılamadı"));
        }
        return ResponseEntity.ok(Map.of("transcription", transcription));
    }
}
