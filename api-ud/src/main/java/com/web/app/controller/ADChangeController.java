package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.service.ADChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hdoc/adca")
@CrossOrigin(origins = "*")
public class ADChangeController {

    @Autowired
    private ADChangeService adChangeService;

    @PostMapping("/select")
    public ResponseEntity<ApiResponse<Map<String, Object>>> selectHdocAdcaChange(
            @RequestBody Map<String, String> request) {
        try {
            String serie = request.get("serie");
            String chnr = request.get("chnr");

            if (serie == null || chnr == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Serie and CHNR are required."));
            }

            HdocAdcaChange record = adChangeService.findBySerieAndChnr(serie, chnr);
            Map<String, Object> data = new HashMap<>();
            data.put("serie", serie);
            data.put("chnr", chnr);
            if (record != null) {
                data.put("count", "1");
                data.put("act", record.getAct());
                data.put("bu", record.getBu());
            } else {
                data.put("count", "0");
                data.put("act", null);
                data.put("bu", null);
            }
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }

    @PostMapping("/insert")
    public ResponseEntity<ApiResponse<Map<String, Object>>> insertHdocAdcaChange(
            @RequestBody Map<String, String> request) {
        try {
            String serie = request.get("serie");
            String chnr = request.get("chnr");
            String act = request.get("act");
            String bu = request.get("bu");
            String reason = request.get("reason");

            if (serie == null || chnr == null || act == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Serie, CHNR and ACT are required."));
            }

            int result = adChangeService.insert(serie, chnr, act, bu, reason);
            if (result > 0) {
                Map<String, Object> data = new HashMap<>();
                data.put("serie", serie);
                data.put("chnr", chnr);
                data.put("act", act);
                return ResponseEntity.ok(ApiResponse.success(data));
            } else {
                return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "Failed to insert ADCA change record."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateHdocAdcaChange() {
        try {
            int updateCount = adChangeService.updateAllActToN();
            Map<String, Object> data = new HashMap<>();
            data.put("updateCount", String.valueOf(updateCount));
            data.put("updateContent", "ACT status has been set to N for all records.");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
