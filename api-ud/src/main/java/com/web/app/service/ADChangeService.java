package com.web.app.service;

public interface ADChangeService {
    int selectCount(String serie, String chnr);
    int insert(String serie, String chnr, String act, String bu, String reason);
    int updateAllActToZero();
}
