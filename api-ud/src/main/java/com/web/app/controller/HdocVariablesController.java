package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.HdocVariablesService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class HdocVariablesController {

  @Autowired
  private HdocVariablesService hdocVariablesService;

  @PostMapping("/variables/add")
  public ResponseEntity<ApiResponse<Map<String, String>>> addVariable(
      @RequestBody Map<String, String> request) {
    try {
      String variable = request.get("variable");
      String type = request.get("type");
      String description = request.get("description");

      if (variable == null || variable.trim().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Variable name is required."));
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = hdocVariablesService.addVariable(variable, type, description, currentUser);
      if (result > 0) {
        Map<String, String> data = new HashMap<>();
        data.put("variable", variable);
        return ResponseEntity.ok(ApiResponse.success(data));
      } else {
        return ResponseEntity.status(500).body(ApiResponse.error(500, "Failed to add variable."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/variables/update")
  public ResponseEntity<ApiResponse<Map<String, String>>> updateVariable(
      @RequestBody Map<String, String> request) {
    try {
      String variable = request.get("variable");
      String type = request.get("type");
      String description = request.get("description");

      if (variable == null || variable.trim().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Variable name is required."));
      }

      String currentUser = request.getOrDefault("currentUser", "SYSTEM");
      int result = hdocVariablesService.updateVariable(variable, type, description, currentUser);
      if (result > 0) {
        Map<String, String> data = new HashMap<>();
        data.put("variable", variable);
        return ResponseEntity.ok(ApiResponse.success(data));
      } else {
        return ResponseEntity.status(404).body(ApiResponse.error(404, "Variable not found."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/variables/delete")
  public ResponseEntity<ApiResponse<Map<String, String>>> deleteVariable(
      @RequestBody Map<String, String> request) {
    try {
      String variable = request.get("variable");
      if (variable == null || variable.trim().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Variable name is required."));
      }

      int result = hdocVariablesService.deleteVariable(variable);
      if (result > 0) {
        Map<String, String> data = new HashMap<>();
        data.put("variable", variable);
        return ResponseEntity.ok(ApiResponse.success(data));
      } else {
        return ResponseEntity.status(404).body(ApiResponse.error(404, "Variable not found."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/variables/search")
  public ResponseEntity<ApiResponse<Map<String, Object>>> searchVariables(
      @RequestBody Map<String, String> request) {
    try {
      String variable = request.get("variable");
      String variableOp = request.getOrDefault("variableOp", "=");
      String type = request.get("type");
      String typeOp = request.getOrDefault("typeOp", "=");
      String description = request.get("description");
      String descriptionOp = request.getOrDefault("descriptionOp", "=");
      String registerUser = request.get("registerUser");
      String registerUserOp = request.getOrDefault("registerUserOp", "=");
      String registerDatetime = request.get("registerDatetime");
      String registerDatetimeOp = request.getOrDefault("registerDatetimeOp", "=");

      List<Map<String, Object>> list =
          hdocVariablesService.searchVariables(
              variable, variableOp,
              type, typeOp,
              description, descriptionOp,
              registerUser, registerUserOp,
              registerDatetime, registerDatetimeOp);

      Map<String, Object> data = new HashMap<>();
      data.put("list", list);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @GetMapping("/variables/export")
  public ResponseEntity<?> exportVariables() {
    try {
      List<Map<String, Object>> list =
          hdocVariablesService.searchVariables(
              null, null,
              null, null,
              null, null,
              null, null,
              null, null);

      StringBuilder csv = new StringBuilder();
      csv.append("Variable,Type,Description,Created by user,Date\n");
      for (Map<String, Object> row : list) {
        csv.append(escapeCsv(String.valueOf(row.get("VARIABLE")))).append(",");
        csv.append(escapeCsv(String.valueOf(row.get("TYPE")))).append(",");
        csv.append(escapeCsv(String.valueOf(row.get("DESCRIPTION")))).append(",");
        csv.append(escapeCsv(String.valueOf(row.get("REGISTER_USER")))).append(",");
        csv.append(escapeCsv(String.valueOf(row.get("REGISTER_DATETIME")))).append("\n");
      }

      String today = new java.text.SimpleDateFormat("yyyyMMdd").format(new Date());
      String fileName = "HDoc_Variables_" + today + ".csv";

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
      headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");

      return ResponseEntity.ok().headers(headers).body(csv.toString());
    } catch (Exception e) {
      return ResponseEntity.status(500).body(ApiResponse.error(500, "CSV导出失败"));
    }
  }

  private String escapeCsv(String value) {
    if (value == null) return "";
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }
}
