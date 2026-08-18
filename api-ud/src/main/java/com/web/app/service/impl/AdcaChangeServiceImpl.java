package com.web.app.service.impl;

import com.web.app.dto.response.AdcaChangeResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.HdocAdcaChangeMapper;
import com.web.app.service.AdcaChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdcaChangeServiceImpl implements AdcaChangeService {

    @Autowired
    private HdocAdcaChangeMapper adcaChangeMapper;

    @Override
    public AdcaChangeResponse selectHdocAdcaChange(String serie, String chnr) {
        HdocAdcaChange record = adcaChangeMapper.selectBySerieAndChnr(serie, chnr);
        if (record == null) {
            throw new BusinessException(404, "Serie-Chnr " + serie + "-" + chnr + " not found.");
        }
        AdcaChangeResponse resp = new AdcaChangeResponse();
        resp.setSerie(record.getSerie());
        resp.setChnr(record.getChnr());
        resp.setAct(record.getAct());
        return resp;
    }

    @Override
    public String insertHdocAdcaChange(String serie, String chnr, String reason) {
        HdocAdcaChange existing = adcaChangeMapper.selectBySerieAndChnr(serie, chnr);
        if (existing != null) {
            throw new BusinessException(409, "AFTER DEF CHANGE IS NOT ACTIVATED.");
        }
        HdocAdcaChange record = new HdocAdcaChange();
        record.setSerie(serie);
        record.setChnr(chnr);
        record.setAct("Y");
        record.setBu("BU1");
        record.setReason(reason);
        record.setRegisterUser("system");
        record.setRegisterProcess("ud16:insert");
        record.setUpdateUser("system");
        record.setUpdateProcess("ud16:insert");
        adcaChangeMapper.insert(record);
        return "Serie-Chnr " + serie + "-" + chnr + " added successfully (ACTIVE).";
    }

    @Override
    public String updateHdocAdcaChange(String serie, String chnr) {
        HdocAdcaChange existing = adcaChangeMapper.selectBySerieAndChnr(serie, chnr);
        if (existing == null) {
            throw new BusinessException(404, "Serie-Chnr " + serie + "-" + chnr + " not found.");
        }
        if ("N".equals(existing.getAct())) {
            throw new BusinessException(400, "Serie-Chnr " + serie + "-" + chnr + " is already INACTIVE.");
        }
        adcaChangeMapper.updateActToN(serie, chnr);
        return "Serie-Chnr " + serie + "-" + chnr + " deleted successfully (INACTIVE).";
    }
}
