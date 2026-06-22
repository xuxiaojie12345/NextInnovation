package com.web.app.service;

import com.web.app.domain.UD07VehicleSpecificationResponse;

/**
 * UD07_VehicleSpecification 服务接口
 */
public interface UD07VehicleSpecificationService {

    /**
     * 获取车辆规格信息
     *
     * @param serie 系列编号
     * @param chassisNo 底盘号
     * @return 车辆规格响应
     */
    UD07VehicleSpecificationResponse getVehicleSpecification(String serie, String chassisNo);
}
