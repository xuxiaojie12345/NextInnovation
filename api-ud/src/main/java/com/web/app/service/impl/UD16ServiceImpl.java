package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocAdcaChange;
import com.web.app.mapper.UD16Mapper;
import com.web.app.service.UD16Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * UD16 Service Implementation
 * 实现AD Change的检查、添加、删除业务逻辑
 */
@Slf4j
@Service
public class UD16ServiceImpl implements UD16Service {

    @Autowired
    private UD16Mapper ud16Mapper;

    /**
     * 将 "SERIE-CHNR" 拆分为 serie 和 chnr
     */
    private String[] parseSerieChnr(String serieChnr) {
        if (serieChnr == null) return new String[]{"", ""};
        int idx = serieChnr.indexOf("-");
        if (idx >= 0) {
            return new String[]{serieChnr.substring(0, idx), serieChnr.substring(idx + 1)};
        }
        return new String[]{"", serieChnr};
    }

    @Override
    public ApiResponse<?> checkADChange(HdocAdcaChange request) {
        log.info("========== UD16 Service: Check AD Change ==========");
        String serieChnr = request.getSerieChnr();
        log.info("serieChnr: {}", serieChnr);

        try {
            if (serieChnr == null || serieChnr.trim().isEmpty()) {
                return ApiResponse.error(400, "Serie-Chnr不能为空");
            }

            String[] parts = parseSerieChnr(serieChnr.trim());
            String serie = parts[0];
            String chnr = parts[1];

            if (serie.isEmpty() || chnr.isEmpty()) {
                return ApiResponse.error(400, "Serie-Chnr格式不正确，需为 SERIE-CHNR 格式");
            }

            // 验证长度
            if (serie.length() > 5) {
                return ApiResponse.error(400, "SERIE长度不能超过5字符");
            }
            if (chnr.length() > 10) {
                return ApiResponse.error(400, "CHNR长度不能超过10字符");
            }

            // 查询记录
            HdocAdcaChange record = ud16Mapper.selectByPrimaryKey(serie, chnr);

            if (record == null) {
                log.warn("AD Change record not found: {}-{}", serie, chnr);
                return ApiResponse.error(404, "记录不存在");
            }

            // 检查ACT状态
            Map<String, Object> data = new HashMap<>();
            data.put("serie", record.getSerie());
            data.put("chnr", record.getChnr());
            data.put("act", record.getAct() != null ? record.getAct() : "");
            data.put("bu", record.getBu() != null ? record.getBu() : "");
            data.put("reason", record.getReason() != null ? record.getReason() : "");

            if ("N".equals(record.getAct())) {
                log.warn("AD Change record is not activated: {}-{}", serie, chnr);
                return ApiResponse.success("AFTER DEF CHANGE IS NOT ACTIVATED", data);
            }

            return ApiResponse.success("检查AD Change成功", data);

        } catch (Exception e) {
            log.error("Error checking AD Change", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> addADChange(HdocAdcaChange request) {
        log.info("========== UD16 Service: Add AD Change ==========");
        log.info("serieChnr: {}, desc: {}", request.getSerieChnr(), request.getDesc());

        try {
            String serieChnr = request.getSerieChnr();
            if (serieChnr == null || serieChnr.trim().isEmpty()) {
                return ApiResponse.error(400, "Serie-Chnr不能为空");
            }

            String[] parts = parseSerieChnr(serieChnr.trim());
            String serie = parts[0];
            String chnr = parts[1];

            if (serie.isEmpty() || chnr.isEmpty()) {
                return ApiResponse.error(400, "Serie-Chnr格式不正确，需为 SERIE-CHNR 格式");
            }

            if (serie.length() > 5) {
                return ApiResponse.error(400, "SERIE长度不能超过5字符");
            }
            if (chnr.length() > 10) {
                return ApiResponse.error(400, "CHNR长度不能超过10字符");
            }

            String desc = request.getDesc();
            if (desc != null && desc.length() > 4000) {
                return ApiResponse.error(400, "Desc长度不能超过4000字符");
            }

            // 检查是否已存在
            int count = ud16Mapper.countByPrimaryKey(serie, chnr);
            if (count > 0) {
                log.warn("AD Change record already exists: {}-{}", serie, chnr);

                // 检查现有记录状态
                HdocAdcaChange existing = ud16Mapper.selectByPrimaryKey(serie, chnr);
                if (existing != null && "N".equals(existing.getAct())) {
                    return ApiResponse.error(400, "AFTER DEF CHANGE IS NOT ACTIVATED");
                }
                return ApiResponse.error(400, "记录已存在");
            }

            // 获取当前登录用户（从请求体获取，若为空则默认为SYSTEM）
            String currentUser = request.getUpdateUser() != null && !request.getUpdateUser().trim().isEmpty()
                    ? request.getUpdateUser().trim() : "SYSTEM";

            // 构建实体
            HdocAdcaChange entity = new HdocAdcaChange();
            entity.setSerie(serie);
            entity.setChnr(chnr);
            entity.setAct("Y");            // 默认活性
            entity.setBu("");              // BU字段前端未提供
            entity.setReason(desc != null ? desc : "");
            entity.setRegisterUser(currentUser);
            entity.setRegisterProcess("UD16_ADD");
            entity.setUpdateUser(currentUser);
            entity.setUpdateProcess("UD16_ADD");

            int result = ud16Mapper.insert(entity);
            if (result > 0) {
                log.info("AD Change record added: {}-{}", serie, chnr);
                Map<String, Object> data = new HashMap<>();
                data.put("serie", serie);
                data.put("chnr", chnr);
                return ApiResponse.success("添加AD Change成功", data);
            } else {
                return ApiResponse.error(500, "添加失败，请重试");
            }

        } catch (Exception e) {
            log.error("Error adding AD Change", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> deleteADChange(HdocAdcaChange request) {
        log.info("========== UD16 Service: Delete AD Change ==========");
        String serieChnr = request.getSerieChnr();
        log.info("serieChnr: {}", serieChnr);

        try {
            if (serieChnr == null || serieChnr.trim().isEmpty()) {
                return ApiResponse.error(400, "Serie-Chnr不能为空");
            }

            String[] parts = parseSerieChnr(serieChnr.trim());
            String serie = parts[0];
            String chnr = parts[1];

            if (serie.isEmpty() || chnr.isEmpty()) {
                return ApiResponse.error(400, "Serie-Chnr格式不正确，需为 SERIE-CHNR 格式");
            }

            // 检查记录是否存在
            int count = ud16Mapper.countByPrimaryKey(serie, chnr);
            if (count == 0) {
                log.warn("AD Change record not found: {}-{}", serie, chnr);
                return ApiResponse.error(400, "记录不存在");
            }

            // 获取当前用户（从请求体获取，若为空则默认为SYSTEM）
            String currentUser = request.getUpdateUser() != null && !request.getUpdateUser().trim().isEmpty()
                    ? request.getUpdateUser().trim() : "SYSTEM";

            // 逻辑删除（ACT置为'N'）
            int result = ud16Mapper.softDelete(serie, chnr, currentUser, "UD16_DELETE");
            if (result > 0) {
                log.info("AD Change record deleted (logical): {}-{}", serie, chnr);
                Map<String, Object> data = new HashMap<>();
                data.put("serie", serie);
                data.put("chnr", chnr);
                return ApiResponse.success("删除AD Change成功", data);
            } else {
                return ApiResponse.error(500, "删除失败，请重试");
            }

        } catch (Exception e) {
            log.error("Error deleting AD Change", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
}
