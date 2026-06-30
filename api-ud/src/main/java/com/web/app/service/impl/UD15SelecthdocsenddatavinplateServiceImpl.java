package com.web.app.service.impl;

import com.web.app.dto.VinPlateResponse;
import com.web.app.entity.HdocSendDataVinPlate;
import com.web.app.mapper.HdocSendDataVinPlateMapper;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class UD15SelecthdocsenddatavinplateServiceImpl implements UD15SelecthdocsenddatavinplateService {

    @Autowired
    private HdocSendDataVinPlateMapper hdocSendDataVinPlateMapper;

    @Override
    public VinPlateResponse viewInfo(String serie, String chnr) {
        HdocSendDataVinPlate entity = hdocSendDataVinPlateMapper.selectBySerieAndChnr(serie, chnr);
        if (entity == null) {
            throw new RuntimeException("查询失败，没有找到VIN Plate数据");
        }
        VinPlateResponse r = new VinPlateResponse();
        r.setType(entity.getType());
        r.setStatus(entity.getStatus() != null ? entity.getStatus().toString() : null);
        r.setMsg(entity.getMsg());
        r.setRegisterDatetime(entity.getRegisterDatetime() != null ? entity.getRegisterDatetime().toString() : null);
        r.setDocReady(entity.getDocReady() != null ? entity.getDocReady().toString() : null);
        r.setDocSent(entity.getDocSent() != null ? entity.getDocSent().toString() : null);
        r.setXmlDoc(entity.getXmlDoc());
        return r;
    }

    @Override
    public void setRegenerate(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess) {
        hdocSendDataVinPlateMapper.updateStatusRegenerate(serie, chnr, updateUser, LocalDateTime.now(), updateProcess);
    }

    @Override
    public void setOk(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess) {
        hdocSendDataVinPlateMapper.updateStatusOk(serie, chnr, updateUser, LocalDateTime.now(), updateProcess);
    }

    @Override
    public void changeToBasicInfo(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess) {
        hdocSendDataVinPlateMapper.updateToBasicInfo(serie, chnr, updateUser, LocalDateTime.now(), updateProcess);
    }

    @Override
    public void changeToAdvancedInfo(String serie, String chnr, String updateUser, String updateDatetime, String updateProcess) {
        hdocSendDataVinPlateMapper.updateToAdvancedInfo(serie, chnr, updateUser, LocalDateTime.now(), updateProcess);
    }
}
