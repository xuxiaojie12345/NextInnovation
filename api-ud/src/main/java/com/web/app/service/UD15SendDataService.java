package com.web.app.service;

import java.util.Map;

public interface UD15SendDataService {
    Map<String, Object> viewInfo(String serie, String chnr);
    int setRegenerate(String serie, String chnr);
    int setOK(String serie, String chnr);
    int changeToBasicInfo(String serie, String chnr);
    int changeToAdvancedInfo(String serie, String chnr);
}
