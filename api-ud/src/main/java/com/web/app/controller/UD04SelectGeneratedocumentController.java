package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD04SelectGeneratedocumentRequest;
import com.web.app.domain.UD04SelectGeneratedocumentResponse;
import com.web.app.service.UD04SelectGeneratedocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD04 Select Generatedocument Controller
 * 接收前端请求,调用业务层处理查询逻辑
 */
@Slf4j
@RestController
@RequestMapping("/api/UD04")
@CrossOrigin(origins = "*")
public class UD04SelectGeneratedocumentController {
    
    @Autowired
    private UD04SelectGeneratedocumentService ud04SelectGeneratedocumentService;
    
    /**
     * 根据Chassis series和Chassis no查询生成文档数据
     * 
     * @param chassisSeries Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @return API响应,包含查询结果
     */
    @GetMapping("/selectGeneratedocument")
    public ResponseEntity<ApiResponse<UD04SelectGeneratedocumentResponse>> selectGeneratedocument(
            @RequestParam String chassisSeries,
            @RequestParam String chassisNo) {
        
        // 4.2 封装请求参数
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries(chassisSeries);
        request.setChassisNo(chassisNo);
        
        // 4.3 调用Service层处理业务逻辑
        ApiResponse<UD04SelectGeneratedocumentResponse> response = 
                ud04SelectGeneratedocumentService.selectGeneratedocument(request);
        
        return ResponseEntity.ok(response);
    }
}
