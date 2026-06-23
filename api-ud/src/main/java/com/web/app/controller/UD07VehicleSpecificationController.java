package com.web.app.controller;

import com.web.app.dto.UD07VehicleSpecificationRequest;
import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.service.UD07VehicleSpecificationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD07 车辆规格控制器
 *
 * 功能说明：提供车辆规格查询接口
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Slf4j
@RestController
@RequestMapping("/api/ud07")
@Api(tags = "UD07 - 车辆规格")
public class UD07VehicleSpecificationController {

    @Autowired
    private UD07VehicleSpecificationService ud07Service;

    @GetMapping("/vehiclespecification")
    @ApiOperation(value = "查询车辆规格", notes = "根据底盘系列和底盘编号查询车辆规格及KOLA变体信息")
    public UD07VehicleSpecificationResponse getVehicleSpecification(
            @ApiParam(value = "底盘系列", required = true, example = "ABC12")
            @RequestParam("serie") String serie,
            @ApiParam(value = "底盘编号", required = true, example = "1234567890")
            @RequestParam("chno") String chno) {

        log.info("收到UD07车辆规格查询请求，serie: {}, chno: {}", serie, chno);

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest(serie, chno);
        UD07VehicleSpecificationResponse response = ud07Service.getHdocRecDataVdaKolaGeneral(request);

        log.info("UD07查询返回，code: {}, msg: {}", response.getCode(), response.getMsg());
        return response;
    }
}
