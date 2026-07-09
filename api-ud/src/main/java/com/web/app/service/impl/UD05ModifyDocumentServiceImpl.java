package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD05ModifyDocumentResponse;
import com.web.app.domain.UD05ModifyDocumentSaveRequest;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.UD05ModifyDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UD05 Modify Document Service Implementation
 * 实现修改文档的核心业务逻辑
 */
@Service
public class UD05ModifyDocumentServiceImpl implements UD05ModifyDocumentService {
    
    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;
    
    /**
     * 初期表示：根据Chassis series和Chassis no查询Variant信息
     * 
     * @param chassisSeries Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @return API响应，包含Variant信息
     */
    @Override
    public ApiResponse<UD05ModifyDocumentResponse> getModifyDocument(String chassisSeries, String chassisNo) {
        
        // 4.4 参数校验
        String validationResult = validateInitialRequest(chassisSeries, chassisNo);
        if (validationResult != null) {
            return ApiResponse.error(400, validationResult);
        }
        
        try {
            // 4.5 只查询Variant信息（market和template由前端从UD04传递过来）
            List<UD05ModifyDocumentResponse.VariableItem> variables = 
                    hdocAdcaModificationMapper.selectVariantInfo(chassisSeries, chassisNo);
            
            // 4.6 判断查询结果（无数据时返回空列表，不阻断画面展示）
            if (variables == null || variables.isEmpty()) {
                variables = List.of(); // 返回空列表
            }
            
            // 封装响应对象（market和template字段保留为空，由前端从URL参数获取或使用默认值）
            UD05ModifyDocumentResponse response = UD05ModifyDocumentResponse.builder()
                    .market("") // 空值，前端会从UD04传递过来的market参数中使用
                    .template("aus/UD_TEST.odt") // 默认模板路径
                    .variables(variables)
                    .build();
            
            // 返回成功响应
            return ApiResponse.success(response);
            
        } catch (Exception e) {
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }
    
    /**
     * Save按钮压下时：更新Modify信息
     * 
     * @param request 保存请求对象
     * @return API响应
     */
    @Override
    public ApiResponse<Void> saveModifyDocument(UD05ModifyDocumentSaveRequest request) {
        
        // 4.4 参数校验
        String validationResult = validateSaveRequest(request);
        if (validationResult != null) {
            return ApiResponse.error(400, validationResult);
        }
        
        try {
            // 4.5 遍历变量列表，逐个更新
            int updateCount = 0;
            for (UD05ModifyDocumentSaveRequest.VariableItem variable : request.getVariables()) {
                // 只更新有值的字段
                if (variable.getNewval() != null && !variable.getNewval().trim().isEmpty()) {
                    int result = hdocAdcaModificationMapper.updateNewval(
                            request.getChassisSeries(),
                            request.getChassisNo(),
                            variable.getVariable(),
                            variable.getNewval(),
                            request.getUpdateUser() != null ? request.getUpdateUser() : "SYSTEM"
                    );
                    
                    if (result > 0) {
                        updateCount++;
                    }
                }
            }
            
            // 返回成功响应
            return ApiResponse.success("操作成功", null);
            
        } catch (Exception e) {
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }
    
    /**
     * 验证初期表示请求参数的合法性
     * 
     * @param chassisSeries Chassis series
     * @param chassisNo Chassis no
     * @return 错误消息，如果验证通过返回null
     */
    private String validateInitialRequest(String chassisSeries, String chassisNo) {
        // 验证Chassis series
        if (chassisSeries == null || chassisSeries.trim().isEmpty()) {
            return "Chassis series is required.";
        }
        
        if (chassisSeries.length() != 4) {
            return "Chassis series must be 4 characters.";
        }
        
        // 验证Chassis no
        if (chassisNo == null || chassisNo.trim().isEmpty()) {
            return "Chassis no is required.";
        }
        
        if (chassisNo.length() > 10) {
            return "Chassis no must not exceed 10 characters.";
        }
        
        // 验证格式（只允许字母和数字）
        if (!chassisSeries.matches("^[a-zA-Z0-9]+$")) {
            return "Chassis series contains invalid characters.";
        }
        
        if (!chassisNo.matches("^[a-zA-Z0-9]+$")) {
            return "Chassis no contains invalid characters.";
        }
        
        return null; // 验证通过
    }
    
    /**
     * 验证Save请求参数的合法性
     * 
     * @param request 保存请求对象
     * @return 错误消息，如果验证通过返回null
     */
    private String validateSaveRequest(UD05ModifyDocumentSaveRequest request) {
        // 验证基础参数
        String baseValidation = validateInitialRequest(
                request.getChassisSeries(), 
                request.getChassisNo()
        );
        if (baseValidation != null) {
            return baseValidation;
        }
        
        // 验证变量列表
        if (request.getVariables() == null || request.getVariables().isEmpty()) {
            return "Variables list is required.";
        }
        
        // 验证每个变量项
        for (int i = 0; i < request.getVariables().size(); i++) {
            UD05ModifyDocumentSaveRequest.VariableItem variable = request.getVariables().get(i);
            
            if (variable.getVariable() == null || variable.getVariable().trim().isEmpty()) {
                return "Variable name at index " + i + " is required.";
            }
            
            // NEWVAL可以为空，表示不更新该字段
        }
        
        return null; // 验证通过
    }
}
