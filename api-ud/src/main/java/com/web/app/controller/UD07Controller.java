package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.VehicleSpecificationResponse;
import com.web.app.service.UD07Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
/**
 * UD07控制器
 * 提供UD07VehicleSpecificationApi接口 - 获取车辆规格信息
 * 对应详细设计：DES-VehicleSpecification-001
 *
 * 接口说明：
 * 客户端通过GET请求访问接口 /api/v1/ud07/vehiclespecification，
 * 将chassisNo（SERIE + 半角空格 + CHNR）作为请求参数发送至后端服务。
 */
@RestController
@RequestMapping("/api/v1/ud07")
/**

 * UD07Controller

 */

public class UD07Controller extends BaseController {@Autowired
    /** ud07Service */

    private UD07Service ud07Service;

    /**
     * UD07VehicleSpecificationApi
     * 获取车辆规格信息，包括型号、制造周、VIN、发动机编号、变体信息等
     *
     * @param chassisNo 底盘编号（格式：serie + 半角空格 + chnr，如"JPCT 013945"）
     * @return 车辆规格信息
     */
    @GetMapping("/vehiclespecification")
    public ApiResponse<VehicleSpecificationResponse> getVehicleSpecification(
            @RequestParam("chassisNo") String chassisNo) {

        logger.info("UD07VehicleSpecificationApi called - chassisNo: {}", chassisNo);

        // 参数非空校验
        if (chassisNo == null || chassisNo.trim().isEmpty()) {
            return ApiResponse.error(400, "Invalid chassis number");
        }

        // 解析chassisNo为serie和chnr（格式：serie + 半角空格 + chnr）
        String[] parts = chassisNo.trim().split(" ", 2);
        if (parts.length < 2) {
            return ApiResponse.error(400, "Invalid chassis number format");
        }

        String serie = parts[0];
        String chnr = parts[1];

        try {
            VehicleSpecificationResponse response = ud07Service.getVehicleSpecification(serie, chnr);

            if (response == null) {
                logger.warn("Vehicle specification not found: {}", chassisNo);
                return ApiResponse.error(400, "Invalid chassis number");
            }

            logger.info("UD07 query success for chassisNo: {}", chassisNo);
            return ApiResponse.success(response);

        } catch (Exception e) {
            logger.error("UD07 query error for chassisNo: " + chassisNo, e);
            return ApiResponse.serverError();
        }
    }
}
