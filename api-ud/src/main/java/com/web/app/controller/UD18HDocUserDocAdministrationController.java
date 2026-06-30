package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD18HDocUserDocAdministrationController {

    @Autowired
    private UD18HDocUserDocAdministrationService userDocAdministrationService;

    @PostMapping("/ud18/selecthdocfunctionauth")
    public ResponseEntity<ApiResponse<Boolean>> selectHdocFunctionAuth(@RequestBody UserIdRequest request) {
        boolean exists = userDocAdministrationService.selectHdocFunctionAuth(request.getUserId());
        return ResponseEntity.ok(ApiResponse.success("用户名取得成功", exists));
    }

    @PostMapping("/ud18/hdocdocumentlist")
    public ResponseEntity<ApiResponse<List<DocListResponse>>> hdocDocumentList() {
        List<DocListResponse> list = userDocAdministrationService.getHdocDocumentList();
        return ResponseEntity.ok(ApiResponse.success("Description取得成功", list));
    }

    @PostMapping("/ud18/selecthdocuserdoc")
    public ResponseEntity<ApiResponse<List<DoctypeResponse>>> selectHdocUserDoc(
        @RequestBody UserIdRequest request) {
        List<DoctypeResponse> list = userDocAdministrationService.selectHdocUserDoc(request.getUserId());
        return ResponseEntity.ok(ApiResponse.success("用户权限取得成功", list));
    }

    @PostMapping("/ud18/deletehdocuserdoc")
    public ResponseEntity<ApiResponse<Void>> deleteHdocUserDoc(@RequestBody DocAuthRequest request) {
        try {
            // 按userId删除该用户所有权限（先删后插避免主键冲突）
            userDocAdministrationService.deleteAllUserDocByUserId(request.getUserId());
            return ResponseEntity.ok(ApiResponse.success("权限删除成功", null));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }

    @PostMapping("/ud18/createhdocuserdoc")
    public ResponseEntity<ApiResponse<Void>> createHdocUserDoc(@RequestBody DocAuthRequest request) {
        try {
            userDocAdministrationService.createHdocUserDoc(
                request.getUserId(), request.getDoctype(),
                request.getRegisterUser() != null ? request.getRegisterUser() : request.getUserId(),
                request.getRegisterProcess() != null ? request.getRegisterProcess() : "HDocUserDocAdministration");
            return ResponseEntity.ok(ApiResponse.success("权限登录成功", null));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }
}
