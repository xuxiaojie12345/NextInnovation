package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD07VehicleSpecificationRequest;
import com.web.app.domain.UD07VehicleSpecificationResponse;

/**
 * UD07 Vehicle Specification Service
 * 车辆规格信息查询服务接口
 */
public interface UD07VehicleSpecificationService {
    
    /**
     * 获取车辆规格信息
     * 
     * @param request 请求对象，包含Chassis no
     * @return API响应，包含车辆基础信息和VDA变体信息
     */
    ApiResponse<UD07VehicleSpecificationResponse> getVehicleSpecification(UD07VehicleSpecificationRequest request);
}
