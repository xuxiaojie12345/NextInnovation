package com.web.app.service;

import com.web.app.entity.HdocSendDataVinPlate;

public interface VinPlateService {
    HdocSendDataVinPlate viewInfo(String chassisNo);
    void setRegenerate(String chassisNo);
    void setOk(String chassisNo);
    void changeToBasicInfo(String chassisNo);
    void changeToAdvancedInfo(String chassisNo);
}
