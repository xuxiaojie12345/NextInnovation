package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD15SendDataService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud15")
@CrossOrigin(origins = "*")
public class UD15SendDataController {

  @Autowired
  private UD15SendDataService ud15SendDataService;

  @PostMapping("/viewInfo")
  public ResponseEntity<ApiResponse<Map<String, Object>>> viewInfo(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (serie == null || chnr == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Serie and CHNR are required."));
      }

      Map<String, Object> data = ud15SendDataService.viewInfo(serie, chnr);
      if (data != null) {
        return ResponseEntity.ok(ApiResponse.success(data));
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Vehicle data record not found."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/setRegenerate")
  public ResponseEntity<ApiResponse<Object>> setRegenerate(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (serie == null || chnr == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Serie and CHNR are required."));
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.setRegenerate(serie, chnr, currentUser);
      if (result > 0) {
        return ResponseEntity.ok(ApiResponse.success(null));
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Vehicle data record not found, update failed."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/setOK")
  public ResponseEntity<ApiResponse<Object>> setOK(@RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (serie == null || chnr == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Serie and CHNR are required."));
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.setOK(serie, chnr, currentUser);
      if (result > 0) {
        return ResponseEntity.ok(ApiResponse.success(null));
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Vehicle data record not found, update failed."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/changeToBasicInfo")
  public ResponseEntity<ApiResponse<Object>> changeToBasicInfo(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (serie == null || chnr == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Serie and CHNR are required."));
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.changeToBasicInfo(serie, chnr, currentUser);
      if (result > 0) {
        return ResponseEntity.ok(ApiResponse.success(null));
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Vehicle data record not found, update failed."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/changeToAdvancedInfo")
  public ResponseEntity<ApiResponse<Object>> changeToAdvancedInfo(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (serie == null || chnr == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Serie and CHNR are required."));
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = ud15SendDataService.changeToAdvancedInfo(serie, chnr, currentUser);
      if (result > 0) {
        return ResponseEntity.ok(ApiResponse.success(null));
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Vehicle data record not found, update failed."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }
}
