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
public class UD20DocumentController extends BaseController {

  @Autowired
  private UD20DocumentService ud20DocumentService;

  @PostMapping("/getDocumentList")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getDocumentList(
      @RequestBody Map<String, String> params) {
    try {
      List<Map<String, Object>> documentList = ud20DocumentService.getDocumentList(params);
      Map<String, Object> data = new HashMap<>();
      data.put("documentList", documentList != null ? documentList : new ArrayList<>());
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/updateDocumentList")
  public ResponseEntity<ApiResponse<Void>> updateDocumentList(
      @RequestBody Map<String, String> params) {
    try {
      if (isParamMissing(params.get("doctype"))
          || isParamMissing(params.get("registerUser"))
          || isParamMissing(params.get("registerDatetime"))) {
        return badRequest("Document type, User and Date are required.");
      }

      int rows = ud20DocumentService.updateDocumentList(params);
      if (rows > 0) {
        return okWithMessage("更新成功");
      } else {
        return notFound("No matching data found. Update failed.");
      }
    } catch (Exception e) {
      return systemError();
    }
  }
}
