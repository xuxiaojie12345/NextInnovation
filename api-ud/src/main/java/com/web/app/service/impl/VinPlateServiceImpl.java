package com.web.app.service.impl;

import com.web.app.entity.HdocSendDataVinPlate;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.HdocSendDataVinPlateMapper;
import com.web.app.service.VinPlateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VinPlateServiceImpl implements VinPlateService {

    @Autowired
    private HdocSendDataVinPlateMapper vinPlateMapper;

    @Override
    public HdocSendDataVinPlate viewInfo(String chassisNo) {
        HdocSendDataVinPlate record = vinPlateMapper.selectByChassisNo(chassisNo);
        if (record == null) {
            throw new BusinessException(404, "Vin Plate record not found for chassisNo: " + chassisNo);
        }
        return record;
    }

    @Override
    public void setRegenerate(String chassisNo) {
        int rows = vinPlateMapper.updateStatus(chassisNo, "0");
        if (rows == 0) {
            throw new BusinessException(404, "Vin Plate record not found for chassisNo: " + chassisNo);
        }
    }

    @Override
    public void setOk(String chassisNo) {
        int rows = vinPlateMapper.updateStatus(chassisNo, "1");
        if (rows == 0) {
            throw new BusinessException(404, "Vin Plate record not found for chassisNo: " + chassisNo);
        }
    }

    @Override
    public void changeToBasicInfo(String chassisNo) {
        int rows = vinPlateMapper.updateStatusAndType(chassisNo, "0", "1");
        if (rows == 0) {
            throw new BusinessException(404, "Vin Plate record not found for chassisNo: " + chassisNo);
        }
    }

    @Override
    public void changeToAdvancedInfo(String chassisNo) {
        int rows = vinPlateMapper.updateStatusAndType(chassisNo, "0", "2");
        if (rows == 0) {
            throw new BusinessException(404, "Vin Plate record not found for chassisNo: " + chassisNo);
        }
    }
}
