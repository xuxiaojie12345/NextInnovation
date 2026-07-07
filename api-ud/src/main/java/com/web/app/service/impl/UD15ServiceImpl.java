package com.web.app.service.impl;

import com.web.app.mapper.UD15Mapper;
import com.web.app.service.UD15Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * UD15SelecthdocsenddatavinplateApi 服务实现类
 */
@Service
public class UD15ServiceImpl implements UD15Service {

    @Autowired
    private UD15Mapper ud15Mapper;

    @Override
    public Map<String, Object> processVinPlate(String serie, String chnr, String operation, String updateUser) {
        switch (operation) {
            case "viewInfo":
                return handleViewInfo(serie, chnr);
            case "setRegenerate":
                return handleSetRegenerate(serie, chnr, updateUser);
            case "setOK":
                return handleSetOK(serie, chnr, updateUser);
            case "changeToBasicInfo":
                return handleChangeToBasicInfo(serie, chnr, updateUser);
            case "changeToAdvancedInfo":
                return handleChangeToAdvancedInfo(serie, chnr, updateUser);
            default:
                throw new IllegalArgumentException("Unknown operation: " + operation);
        }
    }

    private Map<String, Object> handleViewInfo(String serie, String chnr) {
        Map<String, Object> info = ud15Mapper.selectVinPlateInfo(serie, chnr);
        if (info == null) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        // 映射字段名为前端期望的格式（对应详细设计 2.1 控件属性表）
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("chassisNumber", serie + "-" + chnr);
        result.put("plateType", info.getOrDefault("TYPE", ""));
        result.put("status", info.getOrDefault("STATUS", ""));
        result.put("errorMessage", info.getOrDefault("MSG", ""));
        result.put("def", info.getOrDefault("REGISTER_DATETIME", ""));
        result.put("dataReady", info.getOrDefault("DOC_READY", ""));
        result.put("sentToCabFactory", info.getOrDefault("DOC_SENT", ""));
        result.put("printItems", info.getOrDefault("XML_DOC", ""));
        result.put("vpData", info.getOrDefault("XML_DOC", ""));
        return result;
    }

    private Map<String, Object> handleSetRegenerate(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatus(serie, chnr, "0", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status updated successfully.");
        return result;
    }

    private Map<String, Object> handleSetOK(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatus(serie, chnr, "1", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status updated successfully.");
        return result;
    }

    private Map<String, Object> handleChangeToBasicInfo(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatusAndType(serie, chnr, "0", "1", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status and Type updated successfully.");
        return result;
    }

    private Map<String, Object> handleChangeToAdvancedInfo(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatusAndType(serie, chnr, "0", "2", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status and Type updated successfully.");
        return result;
    }
}
