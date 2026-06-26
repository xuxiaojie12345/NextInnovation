package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD19Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud19")
@CrossOrigin(origins = "*")
public class UD19Controller {

    @Autowired
    private UD19Service ud19Service;

    @PostMapping("/selectMarketMaster")
    public ResponseEntity<ApiResponse<Map<String, Object>>> selectMarketMaster() {
        try {
            List<String> marketList = ud19Service.selectAllMarkets();
            Map<String, Object> data = new HashMap<>();
            data.put("marketList", marketList);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }

    @PostMapping("/searchHdoc")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchHdoc(
            @RequestBody Map<String, String> request) {
        try {
            String userid = request.get("userid");
            String user = request.get("user");
            String check = request.get("check");
            String market = request.get("market");

            List<Map<String, Object>> hdocList = ud19Service.searchHdoc(userid, user, market, check);
            Map<String, Object> data = new HashMap<>();
            data.put("hdocList", hdocList != null ? hdocList : new ArrayList<>());
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
