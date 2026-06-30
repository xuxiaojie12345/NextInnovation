package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD16AdChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UD16AdChangeController {

    @Autowired
    private UD16AdChangeService adChangeService;

    @PostMapping("/ud16/selecthdocadcachange")
    public ResponseEntity<ApiResponse<AdcaChangeResponse>> selectHdocAdcaChange(
        @RequestBody AdcaChangeRequest request) {
        try {
            String serie = extractSerie(request.getSerieChnr());
            String chnr = extractChnr(request.getSerieChnr());
            AdcaChangeResponse response = adChangeService.selectHdocAdcaChange(serie, chnr);
            // 拼接serieChnr用于前端判断
            response.setSerieChnr(serie + chnr);
            return ResponseEntity.ok(ApiResponse.success("数据取得成功", response));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }

    @PostMapping("/ud16/inserthdocadcachange")
    public ResponseEntity<ApiResponse<Void>> insertHdocAdcaChange(@RequestBody AdcaChangeRequest request) {
        try {
            String serie = extractSerie(request.getSerieChnr());
            String chnr = extractChnr(request.getSerieChnr());
            adChangeService.insertHdocAdcaChange(serie, chnr, request.getDesc(),
                request.getRegisterUser(), request.getRegisterProcess());
            return ResponseEntity.ok(ApiResponse.success("数据登录成功", null));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }

    @PutMapping("/ud16/updatehdocadcachange")
    public ResponseEntity<ApiResponse<Void>> updateHdocAdcaChange(@RequestBody AdcaChangeRequest request) {
        try {
            String serie = extractSerie(request.getSerieChnr());
            String chnr = extractChnr(request.getSerieChnr());
            adChangeService.updateHdocAdcaChangeToN(serie, chnr,
                request.getUpdateUser(), request.getUpdateProcess());
            return ResponseEntity.ok(ApiResponse.success("数据更新成功", null));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }

    private String extractSerie(String serieChnr) {
        if (serieChnr == null) return null;
        return serieChnr.replaceAll("[0-9]", "");
    }

    private String extractChnr(String serieChnr) {
        if (serieChnr == null) return null;
        return serieChnr.replaceAll("[^0-9]", "");
    }
}
