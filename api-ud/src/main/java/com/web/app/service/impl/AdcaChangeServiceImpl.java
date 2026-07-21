package com.web.app.service.impl;

import com.web.app.dto.response.AdcaChangeResponse;
import com.web.app.entity.HdocAdcaChange;
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
            return null;
        }
        AdcaChangeResponse resp = new AdcaChangeResponse();
        resp.setSerie(record.getSerie());
        resp.setChnr(record.getChnr());
        resp.setAct(record.getAct());
        return resp;
    }

    @Override
    public void insertHdocAdcaChange(String serie, String chnr, String reason) {
        HdocAdcaChange record = new HdocAdcaChange();
        record.setSerie(serie);
        record.setChnr(chnr);
        record.setAct("Y");
        record.setReason(reason);
        adcaChangeMapper.insert(record);
    }

    @Override
    public void updateHdocAdcaChange(String serie, String chnr) {
        adcaChangeMapper.updateActToN(serie, chnr);
    }
}
