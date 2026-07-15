package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.service.VehicleSpecificationService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class VehicleSpecificationController extends BaseController {

  @Autowired
  private VehicleSpecificationService vehicleSpecificationService;

  @PostMapping("/vehiclespecification")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getVehicleSpecification(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chno = request.get("chno");
      if (isParamMissing(serie) || isParamMissing(chno)) {
        return badRequest(MessageConstants.INVALID_CHASSIS_INFO);
      }
      Map<String, Object> data = vehicleSpecificationService.getVehicleSpecification(serie, chno);
      if (data != null) {
        return ok(data);
      } else {
        return notFound(MessageConstants.VEHICLE_DATA_NOT_FOUND);
      }
    } catch (Exception e) {
      return systemError();
    }
  }
}
