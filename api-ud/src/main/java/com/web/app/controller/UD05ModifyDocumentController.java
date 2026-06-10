package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD05ModifyDocumentResponse;
import com.web.app.domain.UD05ModifyDocumentSaveRequest;
import com.web.app.service.UD05ModifyDocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD05 Modify Document Controller
 * 接收前端请求，调用业务层处理修改文档逻辑
 */
@Slf4j
@RestController
@RequestMapping("/api/UD05")
@CrossOrigin(origins = "*")
public class UD05ModifyDocumentController {
    
    @Autowired
    private UD05ModifyDocumentService ud05ModifyDocumentService;
    
    /**
     * 初期表示：根据Chassis series和Chassis no查询Variant信息
     * 
     * @param chassisSeries Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @return API响应，包含Variant信息
     */
    @GetMapping("/modifyDocumentUnit")
    public ResponseEntity<ApiResponse<UD05ModifyDocumentResponse>> modifyDocumentUnit(
            @RequestParam String chassisSeries,
            @RequestParam String chassisNo) {
        
        log.info("========== UD05 Controller: Received GET request for modifyDocumentUnit ==========");
        log.info("Chassis series: {}", chassisSeries);
        log.info("Chassis no: {}", chassisNo);
        
        // 4.3 调用Service层处理业务逻辑
        ApiResponse<UD05ModifyDocumentResponse> response = 
                ud05ModifyDocumentService.getModifyDocument(chassisSeries, chassisNo);
        
        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD05 Controller: Request completed ==========");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Save按钮压下时：更新Modify信息
     * 
     * @param request 保存请求对象
     * @return API响应
     */
    @PostMapping("/modifyDocumentSave")
    public ResponseEntity<ApiResponse<Void>> modifyDocumentSave(
            @RequestBody UD05ModifyDocumentSaveRequest request) {
        
        log.info("========== UD05 Controller: Received POST request for modifyDocumentSave ==========");
        log.info("Chassis series: {}", request.getChassisSeries());
        log.info("Chassis no: {}", request.getChassisNo());
        log.info("Variables count: {}", 
                request.getVariables() != null ? request.getVariables().size() : 0);
        
        // 4.3 调用Service层处理业务逻辑
        ApiResponse<Void> response = ud05ModifyDocumentService.saveModifyDocument(request);
        
        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD05 Controller: Request completed ==========");
        
        return ResponseEntity.ok(response);
    }
}
