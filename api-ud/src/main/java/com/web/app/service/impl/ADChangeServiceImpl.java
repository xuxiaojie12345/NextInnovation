package com.web.app.service.impl;

import com.web.app.entity.HdocAdcaChange;
import com.web.app.mapper.ADChangeMapper;
import com.web.app.service.ADChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ADChangeServiceImpl implements ADChangeService {

    @Autowired
    private ADChangeMapper adChangeMapper;

    @Override
    public HdocAdcaChange findBySerieAndChnr(String serie, String chnr) {
        return adChangeMapper.findBySerieAndChnr(serie, chnr);
    }

    @Override
    public int insert(String serie, String chnr, String act, String bu, String reason, String currentUser) {
        if (currentUser == null || currentUser.trim().isEmpty()) {
            currentUser = "SYSTEM";
        }
        return adChangeMapper.insert(serie, chnr, act, bu, reason, currentUser);
    }

    @Override
    public int updateAllActToN(String currentUser) {
        if (currentUser == null || currentUser.trim().isEmpty()) {
            currentUser = "SYSTEM";
        }
        return adChangeMapper.updateAllActToN(currentUser);
    }


}
