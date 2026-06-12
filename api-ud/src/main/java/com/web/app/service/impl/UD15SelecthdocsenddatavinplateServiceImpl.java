package com.web.app.service.impl;

import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import com.web.app.dto.*;
import com.web.app.mapper.HdocSendDataVinPlateMapper;
import com.web.app.entity.HdocSendDataVinPlate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UD15SelecthdocsenddatavinplateServiceImpl implements UD15SelecthdocsenddatavinplateService {

    @Autowired
    private HdocSendDataVinPlateMapper hdocSendDataVinPlateMapper;

    private String[] parseChassisNumber(String chassisNumber) {
        if (chassisNumber == null || chassisNumber.isEmpty()) {
            return null;
        }
        String[] parts = chassisNumber.split("/");
        if (parts.length != 2) {
            return null;
        }
        return parts;
    }

    @Override
    public UD15ViewInfoResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request) {
        String[] parts = parseChassisNumber(request.getChassisNumber());
        if (parts == null) {
            return UD15ViewInfoResponse.error("Invalid chassis number format");
        }
        HdocSendDataVinPlate plate = hdocSendDataVinPlateMapper.selectBySerieAndChnr(parts[0], parts[1]);
        if (plate == null) {
            return UD15ViewInfoResponse.error("Chassis number " + request.getChassisNumber() + " not found.");
        }
        UD15ViewInfoResponse.DataInfo data = new UD15ViewInfoResponse.DataInfo();
        data.setChassisNumber(request.getChassisNumber());
        data.setType(plate.getTypeField());
        data.setStatus(plate.getStatus() != null ? String.valueOf(plate.getStatus()) : "");
        data.setMessage(plate.getMsg());
        data.setRegisterDatetime(plate.getRegisterDatetime() != null ? plate.getRegisterDatetime().toString() : "");
        data.setDocReady(plate.getDocReady());
        data.setDocSent(plate.getDocSent());
        return UD15ViewInfoResponse.success(data);
    }

    @Override
    public UD15StatusUpdateResponse setRegenerate(UD15SelecthdocsenddatavinplateRequest request) {
        String[] parts = parseChassisNumber(request.getChassisNumber());
        if (parts == null) {
            return UD15StatusUpdateResponse.error("Invalid chassis number format");
        }
        hdocSendDataVinPlateMapper.updateStatus(parts[0], parts[1], 0L);
        return UD15StatusUpdateResponse.success();
    }

    @Override
    public UD15StatusUpdateResponse setOk(UD15SelecthdocsenddatavinplateRequest request) {
        String[] parts = parseChassisNumber(request.getChassisNumber());
        if (parts == null) {
            return UD15StatusUpdateResponse.error("Invalid chassis number format");
        }
        hdocSendDataVinPlateMapper.updateStatus(parts[0], parts[1], 1L);
        return UD15StatusUpdateResponse.success();
    }

    @Override
    public UD15StatusUpdateResponse changeToAdvanced(UD15SelecthdocsenddatavinplateRequest request) {
        String[] parts = parseChassisNumber(request.getChassisNumber());
        if (parts == null) {
            return UD15StatusUpdateResponse.error("Invalid chassis number format");
        }
        hdocSendDataVinPlateMapper.updateStatusAndType(parts[0], parts[1], 0L, "2");
        return UD15StatusUpdateResponse.success();
    }
}
