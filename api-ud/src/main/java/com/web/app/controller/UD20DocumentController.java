package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD20DocumentService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud20")
@CrossOrigin(origins = "*")
public class UD20DocumentController {

  @Autowired
  private UD20DocumentService ud20DocumentService;

  @PostMapping("/getDocumentList")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getDocumentList(
      @RequestBody Map<String, String> params) {
    try {
      List<Map<String, Object>> documentList = ud20DocumentService.getDocumentList(params);
      Map<String, Object> data = new HashMap<>();
      data.put("documentList", documentList != null ? documentList : new ArrayList<>());
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/updateDocumentList")
  public ResponseEntity<ApiResponse<Void>> updateDocumentList(
      @RequestBody Map<String, String> params) {
    try {
      String doctype = params.get("doctype");
      String registerUser = params.get("registerUser");
      String registerDatetime = params.get("registerDatetime");

      if (doctype == null
          || doctype.isEmpty()
          || registerUser == null
          || registerUser.isEmpty()
          || registerDatetime == null
          || registerDatetime.isEmpty()) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Document type, User and Date are required."));
      }

      int rows = ud20DocumentService.updateDocumentList(params);
      if (rows > 0) {
        ApiResponse<Void> res = ApiResponse.success(null);
        res.setMessage("更新成功");
        return ResponseEntity.ok(res);
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "No matching data found. Update failed."));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }
}
