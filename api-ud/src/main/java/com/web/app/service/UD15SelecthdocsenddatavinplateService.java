package com.web.app.service;

import com.web.app.dto.VinPlateResponse;

public interface UD15SelecthdocsenddatavinplateService {
    VinPlateResponse viewInfo(String serie, String chnr);
    void setRegenerate(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess);
    void setOk(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess);
    void changeToBasicInfo(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess);
    void changeToAdvancedInfo(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess);
}
