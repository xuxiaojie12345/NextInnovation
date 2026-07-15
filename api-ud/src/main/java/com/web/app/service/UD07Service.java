package com.web.app.service;

import com.web.app.domain.VehicleSpecificationResponse;

/**
 * UD07业务逻辑接口
 * 对应详细设计：DES-VehicleSpecification-001
 *
 * 提供获取车辆规格信息的方法
 */
 /**

  * UD07Service

  */

public interface UD07Service {

    /**
     * 获取车辆规格信息
     *
     * @param serie 底盘系列号（SERIE）
     * @param chnr  底盘编号（CHNR）
     * @return 车辆规格信息（包含车辆基本信息、发动机信息、S-Note信息）
     */
    VehicleSpecificationResponse getVehicleSpecification(String serie, String chnr);
}
