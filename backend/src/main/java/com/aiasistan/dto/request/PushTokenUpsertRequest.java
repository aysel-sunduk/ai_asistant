package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PushTokenUpsertRequest {

    @NotBlank(message = "pushToken zorunludur")
    @Size(max = 255, message = "pushToken en fazla 255 karakter olabilir")
    private String pushToken;

    @Size(max = 64, message = "platform en fazla 64 karakter olabilir")
    private String platform;

    @Size(max = 128, message = "deviceId en fazla 128 karakter olabilir")
    private String deviceId;

    public String getPushToken() {
        return pushToken;
    }

    public void setPushToken(String pushToken) {
        this.pushToken = pushToken;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
}
