package com.web.app.service.impl;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05UpdateRequest;
import com.web.app.entity.HdocAdcaModification;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.UD05ModifyDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD05 - Modify Document服务实现类
 */
@Service
public class UD05ModifyDocumentServiceImpl implements UD05ModifyDocumentService {

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public UD05ModifyDocumentResponse selectVariableModification(UD05ModifyDocumentRequest request) {
        UD05ModifyDocumentResponse response = new UD05ModifyDocumentResponse();

        // 参数校验
        if (request.getSerie() == null || request.getSerie().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("Serie不能为空");
            return response;
        }
        if (request.getChno() == null || request.getChno().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("Chno不能为空");
            return response;
        }

        // 查询数据
        List<HdocAdcaModification> list = hdocAdcaModificationMapper.selectByCondition(request.getSerie(), request.getChno());

        System.out.println("------UD05-02--------------"+list+"-------------");

        Map<String, Object> data = new HashMap<>();

        if (list == null || list.isEmpty()) {
            // 模拟数据供前端调试
            List<Map<String, Object>> mockList = new java.util.ArrayList<>();
            Map<String, Object> item1 = new HashMap<>();
            item1.put("variable", "VIN");
            item1.put("description", "Vehicle Identification Number");
            item1.put("currentValue", "JPCYZ50A2LT028321");
            item1.put("modifiedValue", null);
            mockList.add(item1);

            Map<String, Object> item2 = new HashMap<>();
            item2.put("variable", "ENGINE_TYPE");
            item2.put("description", "Engine Type Code");
            item2.put("currentValue", "D13K");
            item2.put("modifiedValue", "");
            mockList.add(item2);

            data.put("modifications", mockList);
        } else {
            // HdocAdcaModification实体中字段为newval，转换为前端需要的currentValue
            List<Map<String, Object>> mappedList = new java.util.ArrayList<>();
            for (HdocAdcaModification mod : list) {
                Map<String, Object> item = new HashMap<>();
                item.put("variable", mod.getVariable());
                item.put("description", mod.getDescription());
                item.put("currentValue", mod.getNewval());
                item.put("modifiedValue", "");
                mappedList.add(item);
            }
            data.put("modifications", mappedList);
        }

        data.put("chassisNo", request.getSerie() + request.getChno());
        data.put("market", "AUS");
        data.put("templateFile", "aus/UD_TEST.odt");

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD05ModifyDocumentResponse updateHdocAdcaModification(UD05UpdateRequest request) {
        UD05ModifyDocumentResponse response = new UD05ModifyDocumentResponse();

        if (request.getModifications() == null || request.getModifications().isEmpty()) {
            response.setCode(400);
            response.setMsg("修改列表不能为空");
            return response;
        }

        int successCount = 0;
        for (UD05UpdateRequest.ModificationItem item : request.getModifications()) {
            try {
                // 从chassisNo解析serie和chno
                String chassisNo = request.getChassisNo();
                String serie = chassisNo.length() >= 4 ? chassisNo.substring(0, 4) : chassisNo;
                String chno = chassisNo.length() > 4 ? chassisNo.substring(4) : "";

                int result = hdocAdcaModificationMapper.updateNewVal(
                        serie, chno,
                        item.getVariable(), item.getModifiedValue());
                if (result > 0) {
                    successCount++;
                }
            } catch (Exception e) {
                // 单条失败继续处理下一条
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("msg", "更新成功");
        data.put("successCount", successCount);

        response.setCode(200);
        response.setMsg("更新成功");
        response.setData(data);
        return response;
    }
}
