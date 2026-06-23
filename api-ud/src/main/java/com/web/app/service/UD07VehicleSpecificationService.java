package com.web.app.service;

import com.web.app.dto.UD07VehicleSpecificationRequest;
import com.web.app.dto.UD07VehicleSpecificationResponse;

/**
 * UD07 车辆规格服务接口
 *
 * 功能说明：定义车辆规格查询业务方法
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
public interface UD07VehicleSpecificationService {

    /**
     * 查询车辆规格及KOLA变体信息
     *
     * @param request 查询请求对象
     * @return 响应对象
     */
    UD07VehicleSpecificationResponse getHdocRecDataVdaKolaGeneral(UD07VehicleSpecificationRequest request);
}
