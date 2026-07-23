package com.web.app.service.impl;

import com.web.app.domain.UD16Request;
import com.web.app.mapper.UD16Mapper;
import com.web.app.service.UD16Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
/**

 * UD16ServiceImpl

 */

public class UD16ServiceImpl implements UD16Service {

    @Autowired
    /** ud16Mapper */

    private UD16Mapper ud16Mapper;

    @Override
    /**

     * processAdChange

     */

    public Map<String, Object> processAdChange(UD16Request request) {
        String serieChnr = request.getSerieChnr() != null ? request.getSerieChnr().trim() : "";
        
        // 校验Serie-Chnr格式：支持连字符"-"或空格分隔的SERIE和CHNR
        // 例如 "JPCT-G28321" 或 "JPCT G28321" 均可
        String[] parts = serieChnr.split("[- ]", 2);
        if (parts.length < 2) {
            throw new IllegalArgumentException("Serie-Chnr格式无效，请输入'Serie-Chnr'或'Serie Chnr'格式");
        }
        String serie = parts[0];
        String chnr = parts[1];

        switch (request.getOperation()) {
            case "CHECK":
                return handleCheck(serie, chnr, serieChnr);
            case "ADD":
                return handleAdd(serie, chnr, request.getDesc(), serieChnr);
            case "DELETE":
                return handleDelete(serie, chnr, request.getUser(), request.getProcess());
            default:
                throw new IllegalArgumentException("Unknown operation: " + request.getOperation());
        }
    }

    /**

     * handleCheck

     */

    private Map<String, Object> handleCheck(String serie, String chnr, String serieChnr) {
        Map<String, Object> record = ud16Mapper.selectHdocAdcaChange(serie, chnr);
        Map<String, Object> result = new LinkedHashMap<>();
        if (record != null) {
            // 记录存在: 映射为前端期望格式
            result.put("serieChnr", serieChnr);
            result.put("desc", record.getOrDefault("REASON", ""));
            result.put("status", record.getOrDefault("ACT", ""));
        } else {
            // 记录不存在
            result.put("found", false);
        }
        return result;
    }

    /**

     * handleAdd

     */

    private Map<String, Object> handleAdd(String serie, String chnr, String reason, String serieChnr) {
        // 检查是否存在
        Map<String, Object> existing = ud16Mapper.selectHdocAdcaChange(serie, chnr);
        if (existing != null) {
            throw new IllegalArgumentException("该Serie-Chnr已存在");
        }
        ud16Mapper.insertHdocAdcaChange(serie, chnr, reason);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "添加成功");
        return result;
    }

    /**

     * handleDelete

     */

    private Map<String, Object> handleDelete(String serie, String chnr, String user, String process) {
        ud16Mapper.logicalDeleteHdocAdcaChange(serie, chnr, user, process);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "删除成功");
        return result;
    }
}
