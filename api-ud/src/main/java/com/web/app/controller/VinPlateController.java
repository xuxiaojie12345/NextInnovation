package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.request.UD15StatusRequest;
import com.web.app.entity.HdocSendDataVinPlate;
import com.web.app.service.VinPlateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class VinPlateController {

    @Autowired
    private VinPlateService vinPlateService;

    @PostMapping("/UD15ViewInfo")
    public ApiResponse<HdocSendDataVinPlate> viewInfo(@RequestBody UD15StatusRequest request) {
        return ApiResponse.success(vinPlateService.viewInfo(request.getChassisNo()));
    }

    @PostMapping("/UD15SetRegenerate")
    public ApiResponse<Void> setRegenerate(@RequestBody UD15StatusRequest request) {
        vinPlateService.setRegenerate(request.getChassisNo());
        return ApiResponse.success(null, "Status updated to Regenerate");
    }

    @PostMapping("/UD15SetOK")
    public ApiResponse<Void> setOk(@RequestBody UD15StatusRequest request) {
        vinPlateService.setOk(request.getChassisNo());
        return ApiResponse.success(null, "Status updated to OK");
    }

    @PostMapping("/UD15ChangetoBasicInfo")
    public ApiResponse<Void> changeToBasicInfo(@RequestBody UD15StatusRequest request) {
        vinPlateService.changeToBasicInfo(request.getChassisNo());
        return ApiResponse.success(null, "Changed to Basic Info");
    }

    @PostMapping("/UD15ChangetoAdvancedInfo")
    public ApiResponse<Void> changeToAdvancedInfo(@RequestBody UD15StatusRequest request) {
        vinPlateService.changeToAdvancedInfo(request.getChassisNo());
        return ApiResponse.success(null, "Changed to Advanced Info");
    }
}
