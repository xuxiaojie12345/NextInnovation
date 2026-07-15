package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.service.UD15SendDataService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud15")
@CrossOrigin(origins = "*")
public class UD15SendDataController extends BaseController {

  @Autowired
  private UD15SendDataService ud15SendDataService;

  @PostMapping("/viewInfo")
  public ResponseEntity<ApiResponse<Map<String, Object>>> viewInfo(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (isParamMissing(serie) || isParamMissing(chnr)) {
        return badRequest("Serie and CHNR are required.");
      }

      Map<String, Object> data = ud15SendDataService.viewInfo(serie, chnr);
      if (data != null) {
        return ok(data);
      } else {
        String chassisNo = serie + " " + chnr;
        return notFound("Chassis number " + chassisNo + " not found.");
      }
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/setRegenerate")
  public ResponseEntity<ApiResponse<Object>> setRegenerate(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (isParamMissing(serie) || isParamMissing(chnr)) {
        return badRequest("Serie and CHNR are required.");
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.setRegenerate(serie, chnr, currentUser);
      if (result > 0) {
        return ok(null, MessageConstants.STATUS_REGENERATE);
      } else {
        String chassisNo = serie + " " + chnr;
        return notFound("Chassis number " + chassisNo + " not found.");
      }
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/setOK")
  public ResponseEntity<ApiResponse<Object>> setOK(@RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (isParamMissing(serie) || isParamMissing(chnr)) {
        return badRequest("Serie and CHNR are required.");
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.setOK(serie, chnr, currentUser);
      if (result > 0) {
        return ok(null, MessageConstants.STATUS_OK);
      } else {
        String chassisNo = serie + " " + chnr;
        return notFound("Chassis number " + chassisNo + " not found.");
      }
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/changeToBasicInfo")
  public ResponseEntity<ApiResponse<Object>> changeToBasicInfo(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (isParamMissing(serie) || isParamMissing(chnr)) {
        return badRequest("Serie and CHNR are required.");
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.changeToBasicInfo(serie, chnr, currentUser);
      if (result > 0) {
        return ok(null, MessageConstants.TYPE_CHANGED_TO_BASIC);
      } else {
        String chassisNo = serie + " " + chnr;
        return notFound("Chassis number " + chassisNo + " not found.");
      }
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/changeToAdvancedInfo")
  public ResponseEntity<ApiResponse<Object>> changeToAdvancedInfo(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (isParamMissing(serie) || isParamMissing(chnr)) {
        return badRequest("Serie and CHNR are required.");
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.changeToAdvancedInfo(serie, chnr, currentUser);
      if (result > 0) {
        return ok(null, MessageConstants.TYPE_CHANGED_TO_ADVANCED);
      } else {
        String chassisNo = serie + " " + chnr;
        return notFound("Chassis number " + chassisNo + " not found.");
      }
    } catch (Exception e) {
      return systemError();
    }
  }
}
