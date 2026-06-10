package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD04SelectGeneratedocumentRequest;
import com.web.app.domain.UD04SelectGeneratedocumentResponse;
import com.web.app.mapper.HdocGeneratedocumentMapper;
import com.web.app.service.UD04SelectGeneratedocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * UD04 Select Generatedocument Service Implementation
 * 实现查询生成文档数据的核心业务逻辑
 */
@Slf4j
@Service
public class UD04SelectGeneratedocumentServiceImpl implements UD04SelectGeneratedocumentService {
    
    @Autowired
    private HdocGeneratedocumentMapper hdocGeneratedocumentMapper;
    
    /**
     * 根据Chassis series和Chassis no查询生成文档数据
     * 
     * @param request 请求参数对象
     * @return API响应,包含查询结果
     */
    @Override
    public ApiResponse<UD04SelectGeneratedocumentResponse> selectGeneratedocument(UD04SelectGeneratedocumentRequest request) {
        log.info("========== UD04 Select Generatedocument Start ==========");
        log.info("Request - Chassis series: {}, Chassis no: {}", 
                request.getChassisSeries(), request.getChassisNo());
        
        // 4.4 参数校验
        String validationResult = validateRequest(request);
        if (validationResult != null) {
            log.warn("Validation failed: {}", validationResult);
            return ApiResponse.error(400, validationResult);
        }
        
        try {
            // 4.5 调用Mapper执行数据库查询
            UD04SelectGeneratedocumentResponse response = hdocGeneratedocumentMapper.selectGeneratedocument(
                    request.getChassisSeries(),
                    request.getChassisNo()
            );
            
            // 4.6 判断查询结果
            if (response == null) {
                log.warn("No data found for Chassis series: {}, Chassis no: {}", 
                        request.getChassisSeries(), request.getChassisNo());
                return ApiResponse.error(404, "Chassis not found");
            }
            
            // 4.7 记录查询日志
            log.info("Query successful - Chassis series: {}, Chassis no: {}, Order number: {}", 
                    request.getChassisSeries(), request.getChassisNo(), response.getOrdernumber());
            
            // 4.8 返回成功响应
            log.info("========== UD04 Select Generatedocument End ==========");
            return ApiResponse.success(response);
            
        } catch (Exception e) {
            log.error("System error occurred while querying generatedocument", e);
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }
    
    /**
     * 验证请求参数的合法性
     * 
     * @param request 请求参数对象
     * @return 错误消息,如果验证通过返回null
     */
    private String validateRequest(UD04SelectGeneratedocumentRequest request) {
        // 验证Chassis series
        if (request.getChassisSeries() == null || request.getChassisSeries().trim().isEmpty()) {
            return "Chassis series is required.";
        }
        
        if (request.getChassisSeries().length() != 4) {
            return "Chassis series must be 4 characters.";
        }
        
        // 验证Chassis no
        if (request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
            return "Chassis no is required.";
        }
        
        if (request.getChassisNo().length() > 10) {
            return "Chassis no must not exceed 10 characters.";
        }
        
        // 验证格式(只允许字母和数字)
        if (!request.getChassisSeries().matches("^[a-zA-Z0-9]+$")) {
            return "Chassis series contains invalid characters.";
        }
        
        if (!request.getChassisNo().matches("^[a-zA-Z0-9]+$")) {
            return "Chassis no contains invalid characters.";
        }
        
        return null; // 验证通过
    }
}
