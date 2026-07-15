package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.service.UserAdminService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/user")
@CrossOrigin(origins = "*")
public class UserAdminController extends BaseController {

  @Autowired
  private UserAdminService userAdminService;

  @PostMapping("/info")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getUserAuthInfo(
      @RequestBody Map<String, String> request) {
    try {
      String userid = request.get("userid");
      if (isParamMissing(userid)) {
        return badRequest("User ID is required.");
      }

      Map<String, Object> data = userAdminService.getUserAuthList(userid);
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/update/role")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateRole(
      @RequestBody Map<String, Object> request) {
    try {
      String userid = (String) request.get("userid");
      @SuppressWarnings("unchecked")
      List<Map<String, String>> authList = (List<Map<String, String>>) request.get("authList");

      if (isParamMissing(userid)) {
        return badRequest("User ID is required.");
      }
      if (authList == null || authList.isEmpty()) {
        return badRequest(MessageConstants.AUTH_LIST_REQUIRED);
      }

      String currentUser = (String) request.getOrDefault("currentUser", "SYSTEM");
      int updateCount = userAdminService.updateUserRole(userid, authList, currentUser);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      data.put("updateCount", updateCount);
      data.put("authList", authList);
      return ok(data);
    } catch (Exception e) {
      return systemError("System error: " + e.getMessage());
    }
  }

  @PostMapping("/delete/role")
  public ResponseEntity<ApiResponse<Map<String, Object>>> deleteRole(
      @RequestBody Map<String, String> request) {
    try {
      String userid = request.get("userid");
      if (isParamMissing(userid)) {
        return badRequest("User ID is required.");
      }

      userAdminService.deleteUserRole(userid);
      Map<String, Object> data = new HashMap<>();
      data.put("userId", userid);
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }
}
