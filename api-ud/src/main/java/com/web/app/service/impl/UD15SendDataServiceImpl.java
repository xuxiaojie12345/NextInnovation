package com.web.app.service.impl;

import com.web.app.mapper.HDocSendDataVinPlateMapper;
import com.web.app.service.UD15SendDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UD15SendDataServiceImpl implements UD15SendDataService {

    @Autowired
    private HDocSendDataVinPlateMapper mapper;

    @Override
    public Map<String, Object> viewInfo(String serie, String chnr) {
        return mapper.selectVinPlateInfo(serie, chnr);
    }

    @Override
    public int setRegenerate(String serie, String chnr) {
        return mapper.updateStatus(serie, chnr, "0", null, "UD15SetRegenerate");
    }

    @Override
    public int setOK(String serie, String chnr) {
        return mapper.updateStatus(serie, chnr, "1", null, "UD15SetOK");
    }

    @Override
    public int changeToBasicInfo(String serie, String chnr) {
        return mapper.updateStatusAndType(serie, chnr, "0", "1", "UD15ChangetoBasicInfo");
    }

    @Override
    public int changeToAdvancedInfo(String serie, String chnr) {
        return mapper.updateStatusAndType(serie, chnr, "0", "2", "UD15ChangetoAdvancedInfo");
    }
}
