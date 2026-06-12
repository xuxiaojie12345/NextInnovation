package com.web.app.service.impl;

import com.web.app.service.UD16SelectHdocAdcaChangeService;
import com.web.app.dto.*;
import com.web.app.mapper.HdocAdcaChangeMapper;
import com.web.app.entity.HdocAdcaChange;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service
public class UD16SelectHdocAdcaChangeServiceImpl implements UD16SelectHdocAdcaChangeService {

    @Autowired
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;

    @Override
    public UD16ADChangeResponse insertADChange(UD16ADChangeRequest request) {
        if (request.getSerie() == null || request.getChnr() == null) {
            return UD16ADChangeResponse.error("Serie and Chnr are required");
        }
        int count = hdocAdcaChangeMapper.countBySerieAndChnr(request.getSerie(), request.getChnr());
        if (count > 0) {
            return UD16ADChangeResponse.error("AFTER DEF CHANGE IS NOT ACTIVATED");
        }
        HdocAdcaChange entity = new HdocAdcaChange();
        entity.setSerie(request.getSerie());
        entity.setChnr(request.getChnr());
        entity.setAct("Y");
        entity.setBu("UD");
        entity.setReason(request.getDesc());
        entity.setRegisterDatetime(new Date());
        entity.setUpdateDatetime(new Date());
        hdocAdcaChangeMapper.insert(entity);
        return UD16ADChangeResponse.success("新增成功");
    }

    @Override
    public UD16ADChangeResponse deleteADChange(UD16ADChangeRequest request) {
        if (request.getSerie() == null || request.getChnr() == null) {
            return UD16ADChangeResponse.error("Serie and Chnr are required");
        }
        int count = hdocAdcaChangeMapper.countBySerieAndChnr(request.getSerie(), request.getChnr());
        if (count == 0) {
            return UD16ADChangeResponse.error("删除失败");
        }
        hdocAdcaChangeMapper.deleteBySerieAndChnr(request.getSerie(), request.getChnr());
        return UD16ADChangeResponse.success("删除成功");
    }
}
