package com.web.app.service;

import com.web.app.dto.UD07VehicleSpecificationResponse;

/**
 * UD07 - Vehicle Specification查询服务接口
 */
public interface UD07VehicleSpecificationService {

    /**
     * 查询Vehicle Specification信息
     */
    UD07VehicleSpecificationResponse selectVehicleSpecification(String chassisNo);
}
