package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD07VehicleSpecificationRequest;
import com.web.app.domain.UD07VehicleSpecificationResponse;
import com.web.app.service.UD07VehicleSpecificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD07 Vehicle Specification Controller
 * 车辆规格信息查询控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/UD07")
public class UD07VehicleSpecificationController {
    
    @Autowired
    private UD07VehicleSpecificationService ud07VehicleSpecificationService;
    
    /**
     * 获取车辆规格信息
     * 
     * @param chassisNo Chassis no (完整的底盘号，包含空格)
     * @return API响应，包含车辆基础信息和VDA变体信息
     */
    @GetMapping("/vehicleSpecification")
    public ApiResponse<UD07VehicleSpecificationResponse> getVehicleSpecification(
            @RequestParam("chassisNo") String chassisNo) {
        
        // 构建请求对象
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest();
        request.setChassisNo(chassisNo);
        
        // 调用Service层处理业务逻辑
        return ud07VehicleSpecificationService.getVehicleSpecification(request);
    }
}
