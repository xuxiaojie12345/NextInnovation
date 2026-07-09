package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD06SaveModificationsRequest;
import com.web.app.domain.UD06SaveModificationsResponse;
import com.web.app.service.UD06SaveModificationsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD06 Save Modifications Controller
 * 用于处理查询最新Modify情报的请求
 */
@Slf4j
@RestController
@RequestMapping("/api/UD06")
public class UD06SaveModificationsController {
    
    @Autowired
    private UD06SaveModificationsService ud06SaveModificationsService;
    
    /**
     * 根据Chassis series和Chassis no查询最新的Modify情报
     * 
     * @param chassisSerie Chassis series (底盘系列号)
     * @param chassisNumber Chassis number (底盘号码)
     * @return API响应，包含最新的Modify情报
     */
    @GetMapping("/saveModifications")
    public ApiResponse<UD06SaveModificationsResponse> saveModifications(
            @RequestParam("chassisSerie") String chassisSerie,
            @RequestParam("chassisNumber") String chassisNumber) {
        
        // 构建请求对象（将chassisNumber映射为chassisNo）
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie(chassisSerie)
                .chassisNo(chassisNumber)
                .build();
        
        // 调用Service层处理业务逻辑
        return ud06SaveModificationsService.saveModifications(request);
    }
}
