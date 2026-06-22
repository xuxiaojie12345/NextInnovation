package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD14SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud14")
@CrossOrigin(origins = "*")
public class UD14SearchController {

    @Autowired
    private UD14SearchService ud14SearchService;

    @PostMapping("/selectMarketmaster")
    public ResponseEntity<ApiResponse<Map<String, Object>>> selectMarketmaster() {
        try {
            List<String> marketList = ud14SearchService.selectAllMarkets();
            Map<String, Object> data = new HashMap<>();
            data.put("marketList", marketList);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }

    @PostMapping("/selectHdocUserDefinedRules")
    public ResponseEntity<ApiResponse<Map<String, Object>>> selectHdocUserDefinedRules(
            @RequestBody Map<String, String> request) {
        try {
            String market = request.get("market");
            String filename = request.get("filename");

            if (market == null || filename == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Market and filename are required."));
            }

            List<String> variableList = ud14SearchService.selectVariablesByMarketAndFile(market, filename);
            Map<String, Object> data = new HashMap<>();
            data.put("variableList", variableList);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
