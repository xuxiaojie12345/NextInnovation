package com.web.app.service;

import com.web.app.dto.response.AdcaChangeResponse;

public interface AdcaChangeService {
    AdcaChangeResponse selectHdocAdcaChange(String serie, String chnr);
    void insertHdocAdcaChange(String serie, String chnr, String reason);
    void updateHdocAdcaChange(String serie, String chnr);
}
