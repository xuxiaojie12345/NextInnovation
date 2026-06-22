package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UserDocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class UserDocController {

    @Autowired
    private UserDocService userDocService;

    @PostMapping("/user/doc/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserDoc(@RequestBody Map<String, Object> request) {
        try {
            String userid = (String) request.get("userid");
            @SuppressWarnings("unchecked")
            List<String> doctypeList = (List<String>) request.get("doctype");

            if (userid == null || userid.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "User ID is required."));
            }
            if (doctypeList == null || doctypeList.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Document type list is required."));
            }

            userDocService.updateUserDoc(userid, doctypeList);
            Map<String, Object> data = new HashMap<>();
            data.put("userId", userid);
            data.put("docType", doctypeList);
            data.put("updateTime", new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
                .format(new java.util.Date()));
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
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "User ID is required."));
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> selectUserDoc(@RequestBody Map<String, String> request) {
        try {
            String userid = request.get("userid");
            if (userid == null || userid.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "User ID is required."));
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
