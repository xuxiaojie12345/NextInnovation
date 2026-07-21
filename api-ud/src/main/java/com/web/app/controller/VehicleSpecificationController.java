package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.VehicleSpecificationResponse;
import com.web.app.dto.request.UD07VehicleSpecRequest;
import com.web.app.service.GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class VehicleSpecificationController {

    @Autowired
    private GenerateDocumentService generateDocumentService;

    @PostMapping("/UD07VehicleSpecificationApi")
    public ApiResponse<VehicleSpecificationResponse> getVehicleSpec(
            @RequestBody UD07VehicleSpecRequest request) {
        VehicleSpecificationResponse resp = generateDocumentService.getVehicleSpecification(request.getChassisNo());
        return ApiResponse.success(resp);
    }
}
