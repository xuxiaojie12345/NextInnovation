package com.web.app.service;

import com.web.app.entity.HdocAdcaChange;

public interface ADChangeService {
    HdocAdcaChange findBySerieAndChnr(String serie, String chnr);
    int insert(String serie, String chnr, String act, String bu, String reason);
    int updateAllActToN();
    int reactivate(String serie, String chnr);
}
