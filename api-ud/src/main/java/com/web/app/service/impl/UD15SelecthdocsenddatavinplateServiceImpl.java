package com.web.app.service.impl;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;
import com.web.app.entity.HdocSendDataVinPlate;
import com.web.app.mapper.HdocSendDataVinPlateMapper;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * UD15 - VIN Plate操作服务实现类
 */
@Service
public class UD15SelecthdocsenddatavinplateServiceImpl implements UD15SelecthdocsenddatavinplateService {

    @Autowired
    private HdocSendDataVinPlateMapper hdocSendDataVinPlateMapper;

    /**
     * 从 chassisNumber 中提取 serie（前4位）和 chnr（剩余部分）
     */
    private String extractSerie(String chassisNumber) {
        if (chassisNumber == null || chassisNumber.trim().length() < 4) return chassisNumber;
        return chassisNumber.trim().substring(0, 4);
    }

    private String extractChnr(String chassisNumber) {
        if (chassisNumber == null || chassisNumber.trim().length() < 4) return chassisNumber;
        return chassisNumber.trim().substring(4).trim();
    }

    @Override
    public UD15SelecthdocsenddatavinplateResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request) {
        UD15SelecthdocsenddatavinplateResponse response = new UD15SelecthdocsenddatavinplateResponse();

        if (request.getChassisNumber() == null || request.getChassisNumber().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("Chassis Number不能为空");
            return response;
        }

        String serie = request.getSerie() != null && !request.getSerie().isEmpty()
                ? request.getSerie() : extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());

        HdocSendDataVinPlate data = hdocSendDataVinPlateMapper.selectByCondition(serie, chnr);

        if (data == null) {
            response.setCode(404);
            response.setMsg("Chassis number " + request.getChassisNumber() + " not found.");
            return response;
        }

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD15SelecthdocsenddatavinplateResponse setRegenerate(UD15SelecthdocsenddatavinplateRequest request) {
        UD15SelecthdocsenddatavinplateResponse response = new UD15SelecthdocsenddatavinplateResponse();

        String serie = request.getSerie() != null && !request.getSerie().isEmpty()
                ? request.getSerie() : extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());

        int result = hdocSendDataVinPlateMapper.updateStatusToRegenerate(serie, chnr);
        if (result <= 0) {
            response.setCode(404);
            response.setMsg("Chassis number " + request.getChassisNumber() + " not found.");
            return response;
        }

        response.setCode(200);
        response.setMsg("状态已更新为重新生成");
        return response;
    }

    @Override
    public UD15SelecthdocsenddatavinplateResponse setOk(UD15SelecthdocsenddatavinplateRequest request) {
        UD15SelecthdocsenddatavinplateResponse response = new UD15SelecthdocsenddatavinplateResponse();

        String serie = request.getSerie() != null && !request.getSerie().isEmpty()
                ? request.getSerie() : extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());

        int result = hdocSendDataVinPlateMapper.updateStatusToOk(serie, chnr);
        if (result <= 0) {
            response.setCode(404);
            response.setMsg("Chassis number " + request.getChassisNumber() + " not found.");
            return response;
        }

        response.setCode(200);
        response.setMsg("状态已更新为完成");
        return response;
    }

    @Override
    public UD15SelecthdocsenddatavinplateResponse changeToBasicInfo(UD15SelecthdocsenddatavinplateRequest request) {
        UD15SelecthdocsenddatavinplateResponse response = new UD15SelecthdocsenddatavinplateResponse();

        String serie = request.getSerie() != null && !request.getSerie().isEmpty()
                ? request.getSerie() : extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());

        int result = hdocSendDataVinPlateMapper.updateToBasicInfo(serie, chnr);
        if (result <= 0) {
            response.setCode(404);
            response.setMsg("Chassis number " + request.getChassisNumber() + " not found.");
            return response;
        }

        response.setCode(200);
        response.setMsg("状态已更新为基本信息");
        return response;
    }

    @Override
    public UD15SelecthdocsenddatavinplateResponse changeToAdvancedInfo(UD15SelecthdocsenddatavinplateRequest request) {
        UD15SelecthdocsenddatavinplateResponse response = new UD15SelecthdocsenddatavinplateResponse();

        String serie = request.getSerie() != null && !request.getSerie().isEmpty()
                ? request.getSerie() : extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());

        int result = hdocSendDataVinPlateMapper.updateToAdvancedInfo(serie, chnr);
        if (result <= 0) {
            response.setCode(404);
            response.setMsg("Chassis number " + request.getChassisNumber() + " not found.");
            return response;
        }

        response.setCode(200);
        response.setMsg("状态已更新为高级信息");
        return response;
    }
}
