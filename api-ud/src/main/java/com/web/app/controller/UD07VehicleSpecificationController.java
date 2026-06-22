package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD07VehicleSpecificationResponse;
import com.web.app.service.UD07VehicleSpecificationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD07_VehicleSpecification 控制器
 * 提供车辆规格信息的查询接口
 */
@RestController
@RequestMapping("/api/ud07")
@Api(tags = "UD07-车辆规格管理")
public class UD07VehicleSpecificationController {

    private static final Logger logger = LogManager.getLogger(UD07VehicleSpecificationController.class);

    @Autowired
    private UD07VehicleSpecificationService ud07VehicleSpecificationService;

    /**
     * 查询车辆规格信息
     *
     * @param chassisNo 底盘号（包含系列前缀，如"JPCT028321"）
     * @return 统一响应对象，包含车辆规格信息
     */
    @GetMapping("/vehiclespecification")
    @ApiOperation(value = "查询车辆规格信息", notes = "根据底盘号获取车辆规格信息（Model, Build Week, VIN等）")
    public ApiResponse<UD07VehicleSpecificationResponse> getVehicleSpecification(
            @RequestParam("chassisNo") String chassisNo) {

        logger.info("接收到查询车辆规格信息请求，chassisNo: {}", chassisNo);

        try {
            if (chassisNo == null || chassisNo.trim().isEmpty()) {
                return ApiResponse.error("Chassis no is required");
            }

            // 从 chassisNo 中提取 serie（字母前缀）和 number（数字部分）
            String serie = chassisNo.trim().replaceAll("[0-9]", "");
            String number = chassisNo.trim().replaceAll("[A-Za-z]", "");

            if (serie.isEmpty() || number.isEmpty()) {
                return ApiResponse.error("Invalid chassis no format");
            }

            UD07VehicleSpecificationResponse response =
                    ud07VehicleSpecificationService.getVehicleSpecification(serie, number);

            logger.info("车辆规格信息查询成功");
            return ApiResponse.success("Success", response);

        } catch (Exception e) {
            logger.error("查询车辆规格信息失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
