package com.aiasistan.dto.interview;

import lombok.Data;

@Data
public class UpdateInterviewSessionRequest {
    private String title;
    private String position;
    private String jobDescription;
    private String interviewDate;
}
