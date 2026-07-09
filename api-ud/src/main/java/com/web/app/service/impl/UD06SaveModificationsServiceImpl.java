package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD06SaveModificationsRequest;
import com.web.app.domain.UD06SaveModificationsResponse;
import com.web.app.mapper.HdocModificationsMapper;
import com.web.app.service.UD06SaveModificationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * UD06 Save Modifications Service Implementation
 * 用于查询和返回最新的Modify情报
 */
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
        
        // 4.4 参数校验
        String validationResult = validateRequest(request);
        if (validationResult != null) {
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
                modificationList = Collections.emptyList();
            }
            
            // 4.7-4.8 封装响应对象
            UD06SaveModificationsResponse response = UD06SaveModificationsResponse.builder()
                    .modificationList(modificationList)
                    .build();
            
            // 记录查询日志
            return ApiResponse.success(response);
            
        } catch (Exception e) {
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
