package com.web.app.controller;

import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.service.UD07VehicleSpecificationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD07 - Vehicle Specification查询API控制器
 */
@RestController
@RequestMapping("/api/UD07VehicleSpecificationApi")
@Api(tags = "UD07-Vehicle Specification查询API")
public class UD07VehicleSpecificationController {

    @Autowired
    private UD07VehicleSpecificationService ud07VehicleSpecificationService;

    @GetMapping("/Select/{chassisNo}")
    @ApiOperation("查询Vehicle Specification信息")
    public UD07VehicleSpecificationResponse select(@PathVariable("chassisNo") String chassisNo) {
        UD07VehicleSpecificationResponse response = new UD07VehicleSpecificationResponse();
        response = ud07VehicleSpecificationService.selectVehicleSpecification(chassisNo);
        return response;
    }
}
