package com.web.app.service.impl;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05ModifyDocumentUpdateRequest;
import com.web.app.entity.UD05ModifyDocumentVO;
import com.web.app.mapper.UD05ModifyDocumentMapper;
import com.web.app.service.UD05ModifyDocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * UD05 修改文档变量服务实现类
 *
 * 功能说明：实现UD05查询与更新业务逻辑
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Slf4j
@Service
public class UD05ModifyDocumentServiceImpl implements UD05ModifyDocumentService {

    @Autowired
    private UD05ModifyDocumentMapper ud05Mapper;

    @Override
    public UD05ModifyDocumentResponse UD05SelectVariableModification(UD05ModifyDocumentRequest request) {
        log.info("开始UD05查询，request: {}", request);

        try {
            String validationError = validateSelectRequest(request);
            if (validationError != null) {
                log.warn("UD05查询参数验证失败: {}", validationError);
                return UD05ModifyDocumentResponse.error(400, validationError);
            }

            UD05ModifyDocumentVO vo = ud05Mapper.selectVariableModification(request.getChassisSerie(), request.getChassisNo());
            if (vo == null) {
                log.warn("UD05查询未找到记录，chassisSerie: {}, chassisNo: {}", request.getChassisSerie(), request.getChassisNo());
                return UD05ModifyDocumentResponse.error(404, "Record not found.");
            }

            UD05ModifyDocumentResponse.ModifyDocumentData data = new UD05ModifyDocumentResponse.ModifyDocumentData();
            data.setChassisSerie(vo.getChassisSerie());
            data.setChassisNo(vo.getChassisNo());
            data.setVariable(vo.getVariable());
            data.setDescription(vo.getDescription());
            data.setOldVal(vo.getOldVal());
            data.setNewVal(vo.getNewVal());
            data.setSta(vo.getSta());

            return UD05ModifyDocumentResponse.success(data);
        } catch (Exception e) {
            log.error("UD05查询失败", e);
            return UD05ModifyDocumentResponse.error(500, "System error. Please try again later.");
        }
    }

    @Override
    public UD05ModifyDocumentResponse UD05UpdateHdocAdcaModification(UD05ModifyDocumentUpdateRequest request) {
        log.info("开始UD05更新，request: {}", request);

        try {
            String validationError = validateUpdateRequest(request);
            if (validationError != null) {
                log.warn("UD05更新参数验证失败: {}", validationError);
                return UD05ModifyDocumentResponse.error(400, validationError);
            }

            UD05ModifyDocumentVO existing = ud05Mapper.selectVariableModificationByDescription(
                    request.getChassisSerie(), request.getChassisNo(), request.getDescription());
            if (existing == null) {
                log.warn("UD05更新未找到匹配记录，chassisSerie: {}, chassisNo: {}, description: {}",
                        request.getChassisSerie(), request.getChassisNo(), request.getDescription());
                return UD05ModifyDocumentResponse.error(404, "Record not found.");
            }

            int updatedRows = ud05Mapper.updateHdocAdcaModification(
                    request.getChassisSerie(), request.getChassisNo(), request.getDescription(), request.getNewVal());
            if (updatedRows <= 0) {
                log.warn("UD05更新未修改任何记录，chassisSerie: {}, chassisNo: {}, description: {}",
                        request.getChassisSerie(), request.getChassisNo(), request.getDescription());
                return UD05ModifyDocumentResponse.error(500, "Update failed.");
            }

            return UD05ModifyDocumentResponse.successNoData("Update successful");
        } catch (Exception e) {
            log.error("UD05更新失败", e);
            return UD05ModifyDocumentResponse.error(500, "System error. Please try again later.");
        }
    }

    private String validateSelectRequest(UD05ModifyDocumentRequest request) {
        if (request == null) {
            return "Request is required.";
        }
        if (!StringUtils.hasText(request.getChassisSerie())) {
            return "Chassis serie is required.";
        }
        if (request.getChassisSerie().length() > 5) {
            return "Chassis serie must be at most 5 characters.";
        }
        if (!request.getChassisSerie().matches("^[a-zA-Z0-9]+$")) {
            return "Chassis serie must contain only alphanumeric characters.";
        }
        if (!StringUtils.hasText(request.getChassisNo())) {
            return "Chassis no is required.";
        }
        if (request.getChassisNo().length() > 10) {
            return "Chassis no must be at most 10 characters.";
        }
        if (!request.getChassisNo().matches("^[0-9]+$")) {
            return "Chassis no must contain only digits.";
        }
        return null;
    }

    private String validateUpdateRequest(UD05ModifyDocumentUpdateRequest request) {
        if (request == null) {
            return "Request is required.";
        }
        String baseError = validateSelectRequest(new UD05ModifyDocumentRequest(request.getChassisSerie(), request.getChassisNo()));
        if (baseError != null) {
            return baseError;
        }
        if (!StringUtils.hasText(request.getDescription())) {
            return "Description is required.";
        }
        if (request.getDescription().length() > 100) {
            return "Description must be at most 100 characters.";
        }
        if (!StringUtils.hasText(request.getNewVal())) {
            return "New value is required.";
        }
        if (request.getNewVal().length() > 200) {
            return "New value must be at most 200 characters.";
        }
        return null;
    }
}
