package com.web.app.controller;

import com.web.app.dto.UD07VehicleSpecificationRequest;
import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.service.UD07VehicleSpecificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud07")
public class UD07VehicleSpecificationController {

    @Autowired
    private UD07VehicleSpecificationService ud07VehicleSpecificationService;

    @GetMapping("/vehicle-specification")
    public UD07VehicleSpecificationResponse getVehicleSpecification(UD07VehicleSpecificationRequest request) {
        return ud07VehicleSpecificationService.getVehicleSpecification(request);
    }
}
