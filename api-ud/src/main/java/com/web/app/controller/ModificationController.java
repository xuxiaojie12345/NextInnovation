package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.VariableModificationResponse;
import com.web.app.dto.response.ModificationDetailResponse;
import com.web.app.dto.request.UD05VariableModificationRequest;
import com.web.app.dto.request.UD05UpdateModificationRequest;
import com.web.app.dto.request.UD06SelectModificationRequest;
import com.web.app.service.ModificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ModificationController {

    @Autowired
    private ModificationService modificationService;

    @PostMapping("/UD05SelectVariableModification")
    public ApiResponse<VariableModificationResponse> selectVariableModification(
            @RequestBody UD05VariableModificationRequest request) {
        VariableModificationResponse resp = modificationService.getVariableModification(request.getChassisNo());
        return ApiResponse.success(resp);
    }

    @PostMapping("/UD05UpdateHdocAdcaModification")
    public ApiResponse<Void> updateModification(@RequestBody UD05UpdateModificationRequest request) {
        modificationService.updateModification(request);
        return ApiResponse.success(null, "Modifications saved successfully");
    }

    @PostMapping("/UD06SelectHdocAdcaModification")
    public ApiResponse<ModificationDetailResponse> selectModification(
            @RequestBody UD06SelectModificationRequest request) {
        ModificationDetailResponse resp = modificationService.getModificationDetail(
            request.getSerie(), request.getChassisNo());
        if (resp == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "No modification data found.");
        }
        return ApiResponse.success(resp);
    }
}
