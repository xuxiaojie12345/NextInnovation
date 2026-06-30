package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UD15SelecthdocsenddatavinplateController {

    @Autowired
    private UD15SelecthdocsenddatavinplateService selecthdocsenddatavinplateService;

    @PostMapping("/ud15/viewinfo")
    public ResponseEntity<ApiResponse<VinPlateResponse>> viewInfo(@RequestBody VinPlateRequest request) {
        try {
            String serie = extractSerie(request.getChassisNumber());
            String chnr = extractChnr(request.getChassisNumber());
            VinPlateResponse response = selecthdocsenddatavinplateService.viewInfo(serie, chnr);
            return ResponseEntity.ok(ApiResponse.success("查询成功", response));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }

    @PostMapping("/ud15/setregenerate")
    public ResponseEntity<ApiResponse<Void>> setRegenerate(@RequestBody VinPlateUpdateRequest request) {
        String serie = extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());
        selecthdocsenddatavinplateService.setRegenerate(serie, chnr, request.getUpdateUser(),
            request.getUpdateDatetime(), request.getUpdateProcess());
        return ResponseEntity.ok(ApiResponse.success("数据更新成功", null));
    }

    @PostMapping("/ud15/setok")
    public ResponseEntity<ApiResponse<Void>> setOk(@RequestBody VinPlateUpdateRequest request) {
        String serie = extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());
        selecthdocsenddatavinplateService.setOk(serie, chnr, request.getUpdateUser(),
            request.getUpdateDatetime(), request.getUpdateProcess());
        return ResponseEntity.ok(ApiResponse.success("数据更新成功", null));
    }

    @PostMapping("/ud15/changetobasicinfo")
    public ResponseEntity<ApiResponse<Void>> changeToBasicInfo(@RequestBody VinPlateTypeRequest request) {
        String serie = extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());
        selecthdocsenddatavinplateService.changeToBasicInfo(serie, chnr, request.getUpdateUser(),
            request.getUpdateDatetime(), request.getUpdateProcess());
        return ResponseEntity.ok(ApiResponse.success("数据更新成功", null));
    }

    @PostMapping("/ud15/changetoadvancedinfo")
    public ResponseEntity<ApiResponse<Void>> changeToAdvancedInfo(@RequestBody VinPlateTypeRequest request) {
        String serie = extractSerie(request.getChassisNumber());
        String chnr = extractChnr(request.getChassisNumber());
        selecthdocsenddatavinplateService.changeToAdvancedInfo(serie, chnr, request.getUpdateUser(),
            request.getUpdateDatetime(), request.getUpdateProcess());
        return ResponseEntity.ok(ApiResponse.success("数据更新成功", null));
    }

    private String extractSerie(String chassisNo) {
        if (chassisNo == null) return null;
        return chassisNo.replaceAll("[0-9]", "");
    }

    private String extractChnr(String chassisNo) {
        if (chassisNo == null) return null;
        return chassisNo.replaceAll("[^0-9]", "");
    }
}
