package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD06SaveModificationsRequest;
import com.web.app.domain.UD06SaveModificationsResponse;
import com.web.app.mapper.HdocModificationsMapper;
import com.web.app.service.UD06SaveModificationsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * UD06 Save Modifications Service Implementation
 * 用于查询和返回最新的Modify情报
 */
@Slf4j
@Service
public class UD06SaveModificationsServiceImpl implements UD06SaveModificationsService {
    
    @Autowired
    private HdocModificationsMapper hdocModificationsMapper;
    
    /**
     * 根据Chassis series和Chassis no查询最新的Modify情报
     * 
     * @param request 请求对象，包含chassisSerie和chassisNo
     * @return API响应，包含最新的Modify情报
     */
    @Override
    public ApiResponse<UD06SaveModificationsResponse> saveModifications(UD06SaveModificationsRequest request) {
        log.info("========== UD06 Save Modifications Start ==========");
        log.info("Request - Chassis serie: {}, Chassis no: {}", request.getChassisSerie(), request.getChassisNo());
        
        // 4.4 参数校验
        String validationResult = validateRequest(request);
        if (validationResult != null) {
            log.warn("Validation failed: {}", validationResult);
            return ApiResponse.error(400, validationResult);
        }
        
        try {
            // 4.5-4.6 调用Mapper查询最新的Modify情报
            List<UD06SaveModificationsResponse.ModificationItem> modificationList = 
                    hdocModificationsMapper.selectLatestModification(
                            request.getChassisSerie(), 
                            request.getChassisNo()
                    );
            
            // 4.6 判断查询结果（无数据时返回空列表）
            if (modificationList == null || modificationList.isEmpty()) {
                log.warn("No modification data found for Chassis serie: {}, Chassis no: {}", 
                        request.getChassisSerie(), request.getChassisNo());
                modificationList = Collections.emptyList();
            } else {
                log.info("Query successful - Found latest modification record");
                log.info("  DOCTYPE: {}, VERS: {}, VARIABLE: {}, NEWVAL: {}, UPDATE_DATETIME: {}",
                        modificationList.get(0).getDOCTYPE(),
                        modificationList.get(0).getVERS(),
                        modificationList.get(0).getVARIABLE(),
                        modificationList.get(0).getNEWVAL(),
                        modificationList.get(0).getUPDATE_DATETIME());
            }
            
            // 4.7-4.8 封装响应对象
            UD06SaveModificationsResponse response = UD06SaveModificationsResponse.builder()
                    .modificationList(modificationList)
                    .build();
            
            // 记录查询日志
            log.info("========== UD06 Save Modifications End ==========");
            return ApiResponse.success(response);
            
        } catch (Exception e) {
            log.error("System error occurred while querying modifications", e);
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }
    
    /**
     * 校验请求参数
     * 
     * @param request 请求对象
     * @return 如果校验失败返回错误消息，成功返回null
     */
    private String validateRequest(UD06SaveModificationsRequest request) {
        // 检查Chassis serie是否为空
        if (request.getChassisSerie() == null || request.getChassisSerie().trim().isEmpty()) {
            return "Chassis serie不能为空";
        }
        
        // 检查Chassis serie长度（应为4位）
        if (request.getChassisSerie().length() != 4) {
            return "Chassis serie长度必须为4位";
        }
        
        // 检查Chassis no是否为空
        if (request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
            return "Chassis no不能为空";
        }
        
        // 检查Chassis no格式（只能包含数字和字母）
        if (!request.getChassisNo().matches("^[a-zA-Z0-9]+$")) {
            return "Chassis no只能包含字母和数字";
        }
        
        return null; // 校验通过
    }
}
