package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UserAdminService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/user")
@CrossOrigin(origins = "*")
public class UserAdminController {

  @Autowired
  private UserAdminService userAdminService;

  @PostMapping("/info")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getUserAuthInfo(
      @RequestBody Map<String, String> request) {
    try {
      String userid = request.get("userid");
      if (userid == null || userid.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "User ID is required."));
      }

      Map<String, Object> data = userAdminService.getUserAuthList(userid);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/update/role")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateRole(
      @RequestBody Map<String, Object> request) {
    try {
      String userid = (String) request.get("userid");
      @SuppressWarnings("unchecked")
      List<Map<String, String>> authList = (List<Map<String, String>>) request.get("authList");

      if (userid == null || userid.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "User ID is required."));
      }
      if (authList == null || authList.isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "Auth list is required."));
      }

      String currentUser = (String) request.getOrDefault("currentUser", "SYSTEM");
      int updateCount = userAdminService.updateUserRole(userid, authList, currentUser);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      data.put("updateCount", updateCount);
      data.put("authList", authList);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error: " + e.getMessage()));
    }
  }

  @PostMapping("/delete/role")
  public ResponseEntity<ApiResponse<Map<String, Object>>> deleteRole(
      @RequestBody Map<String, String> request) {
    try {
      String userid = request.get("userid");
      if (userid == null || userid.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "User ID is required."));
      }

      userAdminService.deleteUserRole(userid);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }
}
