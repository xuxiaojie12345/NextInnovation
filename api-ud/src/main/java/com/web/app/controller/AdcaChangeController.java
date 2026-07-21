package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.AdcaChangeResponse;
import com.web.app.dto.request.UD16SerieChnrRequest;
import com.web.app.dto.request.UD16InsertAdcaChangeRequest;
import com.web.app.service.AdcaChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AdcaChangeController {

    @Autowired
    private AdcaChangeService adcaChangeService;

    @PostMapping("/UD16SelectHdocAdcaChange")
    public ApiResponse<AdcaChangeResponse> selectHdocAdcaChange(@RequestBody UD16SerieChnrRequest request) {
        return ApiResponse.success(adcaChangeService.selectHdocAdcaChange(request.getSerie(), request.getChnr()));
    }

    @PostMapping("/UD16InsertHdocAdcaChange")
    public ApiResponse<Void> insertHdocAdcaChange(@RequestBody UD16InsertAdcaChangeRequest request) {
        adcaChangeService.insertHdocAdcaChange(request.getSerie(), request.getChnr(), request.getReason());
        return ApiResponse.success(null, "AD Change inserted successfully");
    }

    @PostMapping("/UD16UpdateHdocAdcaChange")
    public ApiResponse<Void> updateHdocAdcaChange(@RequestBody UD16SerieChnrRequest request) {
        adcaChangeService.updateHdocAdcaChange(request.getSerie(), request.getChnr());
        return ApiResponse.success(null, "AD Change updated successfully");
    }
}
