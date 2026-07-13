package com.web.app.service.impl;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05ModifyDocumentUpdateRequest;
import com.web.app.dto.UD05ModifyDocumentUpdateRequest.ModifyItem;
import com.web.app.entity.UD05ModifyDocumentVO;
import com.web.app.mapper.UD05ModifyDocumentMapper;
import com.web.app.service.UD05ModifyDocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

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

            List<UD05ModifyDocumentVO> voList = ud05Mapper.selectVariableModification(request.getChassisSerie(),
                    request.getChassisNo());
            if (voList == null || voList.isEmpty()) {
                log.warn("UD05查询未找到记录，chassisSerie: {}, chassisNo: {}", request.getChassisSerie(),
                        request.getChassisNo());
                return UD05ModifyDocumentResponse.error(404, "Record not found.");
            }

            List<UD05ModifyDocumentResponse.ModifyDocumentData> dataList = voList.stream().map(vo -> {
                UD05ModifyDocumentResponse.ModifyDocumentData item = new UD05ModifyDocumentResponse.ModifyDocumentData();
                item.setChassisSerie(vo.getChassisSerie());
                item.setChassisNo(vo.getChassisNo());
                item.setVariable(vo.getVariable());
                item.setDescription(vo.getDescription());
                item.setOldVal(vo.getOldVal());
                item.setNewVal(vo.getNewVal());
                item.setSta(vo.getSta());
                return item;
            }).collect(Collectors.toList());

            return UD05ModifyDocumentResponse.success(dataList);
        } catch (Exception e) {
            log.error("UD05查询失败", e);
            return UD05ModifyDocumentResponse.error(500, "System error. Please try again later.");
        }
    }

    @Override
    @Transactional
    public UD05ModifyDocumentResponse UD05UpdateHdocAdcaModification(UD05ModifyDocumentUpdateRequest request) {
        log.info("开始UD05更新，request: {}", request);

        try {
            String validationError = validateUpdateRequest(request);
            if (validationError != null) {
                log.warn("UD05更新参数验证失败: {}", validationError);
                return UD05ModifyDocumentResponse.error(400, validationError);
            }

            int totalUpdated = 0;
            for (ModifyItem item : request.getModifiedItems()) {
                if (item == null) {
                    continue;
                }
                String variable = item.getVariable();
                String currentValue = item.getCurrentValue();
                String modifiedValue = item.getModifiedValue();

                // 获取登录用户ID，用于记录更新人
                String user = request.getUserId();
                if (!StringUtils.hasText(user)) {
                    log.warn("UD05更新缺少userId");
                    return UD05ModifyDocumentResponse.error(400, "User ID is required.");
                }

                int updatedRows = ud05Mapper.updateHdocAdcaModificationByVariable(
                        request.getChassisSerie(), request.getChassisNo(), variable, currentValue, modifiedValue, user);
                if (updatedRows <= 0) {
                    log.warn("UD05更新未修改任何记录，chassisSerie: {}, chassisNo: {}, variable: {}, currentValue: {}",
                            request.getChassisSerie(), request.getChassisNo(), variable, currentValue);
                    return UD05ModifyDocumentResponse.error(500, "Update failed.");
                }
                totalUpdated += updatedRows;
            }

            if (totalUpdated <= 0) {
                return UD05ModifyDocumentResponse.error(500, "No records were updated.");
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
        String baseError = validateSelectRequest(
                new UD05ModifyDocumentRequest(request.getChassisSerie(), request.getChassisNo()));
        if (baseError != null) {
            return baseError;
        }
        if (request.getModifiedItems() == null || request.getModifiedItems().isEmpty()) {
            return "At least one modified item is required.";
        }
        for (UD05ModifyDocumentUpdateRequest.ModifyItem item : request.getModifiedItems()) {
            if (item == null) {
                return "Modified item cannot be null.";
            }
            if (!StringUtils.hasText(item.getVariable())) {
                return "Variable is required for each modified item.";
            }
            if (!StringUtils.hasText(item.getCurrentValue())) {
                return "Current value is required for each modified item.";
            }
            if (item.getCurrentValue().length() > 200) {
                return "Current value must be at most 200 characters.";
            }
            if (!StringUtils.hasText(item.getModifiedValue())) {
                return "Modified value is required for each modified item.";
            }
            if (item.getModifiedValue().length() > 200) {
                return "Modified value must be at most 200 characters.";
            }
        }
        return null;
    }
}
