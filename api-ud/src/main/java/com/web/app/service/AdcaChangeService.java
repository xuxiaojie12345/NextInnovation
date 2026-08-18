package com.web.app.service;

import com.web.app.dto.response.AdcaChangeResponse;

public interface AdcaChangeService {
    AdcaChangeResponse selectHdocAdcaChange(String serie, String chnr);
    String insertHdocAdcaChange(String serie, String chnr, String reason);
    String updateHdocAdcaChange(String serie, String chnr);
}
