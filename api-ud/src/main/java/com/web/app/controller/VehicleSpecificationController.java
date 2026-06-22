package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.VehicleSpecificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class VehicleSpecificationController {

    @Autowired
    private VehicleSpecificationService vehicleSpecificationService;

    @PostMapping("/vehiclespecification")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVehicleSpecification(
            @RequestBody Map<String, String> request) {
        try {
            String serie = request.get("serie");
            String chno = request.get("chno");
            if (serie == null || chno == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Invalid chassis information."));
            }
            Map<String, Object> data = vehicleSpecificationService.getVehicleSpecification(serie, chno);
            if (data != null) {
                return ResponseEntity.ok(ApiResponse.success(data));
            } else {
                return ResponseEntity.status(404)
                    .body(ApiResponse.error(404, "No vehicle data found for the given chassis number."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
