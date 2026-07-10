package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UserDocService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class UserDocController {

  @Autowired
  private UserDocService userDocService;

  @PostMapping("/user/doc/delete")
  public ResponseEntity<ApiResponse<Map<String, Object>>> deleteUserDoc(
      @RequestBody Map<String, String> request) {
    try {
      String userid = request.get("userid");
      if (userid == null || userid.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "User ID is required."));
      }

      userDocService.deleteUserDoc(userid);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/user/doc/create")
  public ResponseEntity<ApiResponse<Map<String, Object>>> createUserDoc(
      @RequestBody Map<String, Object> request) {
    try {
      String userid = (String) request.get("userid");
      String doctype = (String) request.get("doctype");
      String currentUser = (String) request.getOrDefault("currentUser", "SYSTEM");

      if (userid == null || userid.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "User ID is required."));
      }
      if (doctype == null || doctype.trim().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Document type is required."));
      }

      userDocService.createUserDoc(userid, doctype, currentUser);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      data.put("docType", doctype);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/function/auth/count")
  public ResponseEntity<ApiResponse<Map<String, Object>>> selectFunctionAuthCount(
      @RequestBody Map<String, String> request) {
    try {
      String userid = request.get("userid");
      if (userid == null || userid.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "User ID is required."));
      }

      int count = userDocService.selectFunctionAuthCount(userid);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      data.put("authCount", count);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/user/doc/select")
  public ResponseEntity<ApiResponse<Map<String, Object>>> selectUserDoc(
      @RequestBody Map<String, String> request) {
    try {
      String userid = request.get("userid");
      if (userid == null || userid.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "User ID is required."));
      }

      List<String> docTypeList = userDocService.selectUserDoc(userid);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      data.put("docTypeList", docTypeList != null ? docTypeList : new ArrayList<>());
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }
}
