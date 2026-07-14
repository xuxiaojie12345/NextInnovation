package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.ModifyDocumentService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class ModifyDocumentController {

  @Autowired
  private ModifyDocumentService modifyDocumentService;

  @PostMapping("/modifydocument/select")
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> selectModifications(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");
      if (serie == null || chnr == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Invalid chassis information."));
      }
      List<Map<String, Object>> list = modifyDocumentService.selectModifications(serie, chnr);
      // Transform keys to camelCase for frontend
      List<Map<String, Object>> result = new ArrayList<>();
      for (Map<String, Object> item : list) {
        Map<String, Object> transformed = new LinkedHashMap<>();
        transformed.put("variable", item.get("VARIABLE"));
        transformed.put("description", item.get("DESCRIPTION"));
        transformed.put("newVal", item.get("NEWVAL"));
        result.add(transformed);
      }
      return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/modifydocument/update")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateModifications(
      @RequestBody Map<String, Object> request) {
    try {
      String serie = (String) request.get("serie");
      String chnr = (String) request.get("chnr");
      String currentUser = (String) request.get("currentUser");
      @SuppressWarnings("unchecked")
      List<Map<String, String>> modifications =
          (List<Map<String, String>>) request.get("modifications");

      if (serie == null || chnr == null || modifications == null || modifications.isEmpty()) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Invalid request parameters."));
      }

      int count = modifyDocumentService.updateModifications(serie, chnr, modifications, currentUser);
      Map<String, Object> data = new HashMap<>();
      data.put("updateCount", count);
      ApiResponse<Map<String, Object>> response = ApiResponse.success(data);
      response.setMessage("Variables updated successfully.");
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }
}
