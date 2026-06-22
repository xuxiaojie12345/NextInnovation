package com.web.app.service.impl;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;
import com.web.app.entity.HdocAdcaModification;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.UD06SaveModificationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD06 - Save Modifications查询服务实现类
 */
@Service
public class UD06SaveModificationsServiceImpl implements UD06SaveModificationsService {

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public UD06SaveModificationsResponse selectHdocAdcaModification(UD06SaveModificationsRequest request) {
        UD06SaveModificationsResponse response = new UD06SaveModificationsResponse();

        // 参数校验
        if (request.getChassisSerie() == null || request.getChassisSerie().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("Chassis Serie不能为空");
            return response;
        }
        if (request.getChassisNumber() == null || request.getChassisNumber().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("Chassis Number不能为空");
            return response;
        }

        // 查询数据
        List<HdocAdcaModification> list = hdocAdcaModificationMapper.selectByCondition(
                request.getChassisSerie(), request.getChassisNumber());

        Map<String, Object> data = new HashMap<>();

        if (list == null || list.isEmpty()) {
            // 模拟数据供前端调试
            data.put("doctype", "DIM-PLATE");
            data.put("version", "1");
            data.put("storing", "SEAT_NO 4");
            data.put("foundUnreleasedVersion", 1);
            data.put("message", "VERSION IS RELEASED");
        } else {
            data.put("doctype", "DIM-PLATE");
            data.put("version", "1");
            data.put("storing", list.get(0).getVariable() + " " + list.get(0).getNewval());
            data.put("foundUnreleasedVersion", 1);
            data.put("message", "VERSION IS RELEASED");
        }

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }
}
