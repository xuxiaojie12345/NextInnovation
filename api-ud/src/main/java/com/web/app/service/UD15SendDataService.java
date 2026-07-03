package com.web.app.service;

import java.util.Map;

public interface UD15SendDataService {
    Map<String, Object> viewInfo(String serie, String chnr);
    int setRegenerate(String serie, String chnr, String updateUser);
    int setOK(String serie, String chnr, String updateUser);
    int changeToBasicInfo(String serie, String chnr, String updateUser);
    int changeToAdvancedInfo(String serie, String chnr, String updateUser);
}
