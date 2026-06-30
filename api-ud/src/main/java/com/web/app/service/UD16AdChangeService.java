package com.web.app.service;

import com.web.app.dto.AdcaChangeResponse;

public interface UD16AdChangeService {
    AdcaChangeResponse selectHdocAdcaChange(String serie, String chnr);
    void insertHdocAdcaChange(String serie, String chnr, String reason, String registerUser, String registerProcess);
    void updateHdocAdcaChangeToN(String serie, String chnr, String updateUser, String updateProcess);
}
