package com.web.app.service.impl;

import com.web.app.dto.AdcaChangeResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.mapper.HdocAdcaChangeMapper;
import com.web.app.service.UD16AdChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class UD16AdChangeServiceImpl implements UD16AdChangeService {

    @Autowired
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;

    @Override
    public AdcaChangeResponse selectHdocAdcaChange(String serie, String chnr) {
        HdocAdcaChange entity = hdocAdcaChangeMapper.selectBySerieAndChnr(serie, chnr);
        if (entity == null) {
            throw new RuntimeException("数据取得成功，没有找到对应数据");
        }
        AdcaChangeResponse r = new AdcaChangeResponse();
        r.setSerie(entity.getSerie());
        r.setChnr(entity.getChnr());
        return r;
    }

    @Override
    public void insertHdocAdcaChange(String serie, String chnr, String reason, String registerUser, String registerProcess) {
        HdocAdcaChange record = new HdocAdcaChange();
        record.setSerie(serie);
        record.setChnr(chnr);
        record.setAct("Y");
        record.setBu("UD");
        record.setReason(reason);
        record.setRegisterUser(registerUser);
        record.setRegisterDatetime(LocalDateTime.now());
        record.setRegisterProcess(registerProcess);
        record.setUpdateUser(registerUser);
        record.setUpdateDatetime(LocalDateTime.now());
        record.setUpdateProcess(registerProcess);
        hdocAdcaChangeMapper.insertAdcaChange(record);
    }

    @Override
    public void updateHdocAdcaChangeToN(String serie, String chnr, String updateUser, String updateProcess) {
        int result = hdocAdcaChangeMapper.updateActToN(serie, chnr, updateUser, LocalDateTime.now(), updateProcess);
        if (result <= 0) {
            throw new RuntimeException("数据更新失败，未找到该记录");
        }
    }
}
