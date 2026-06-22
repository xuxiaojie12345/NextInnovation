package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.mapper.SaveModificationsMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class SaveModificationsController {

    @Autowired
    private SaveModificationsMapper saveModificationsMapper;

    @PostMapping("/adcamodification")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdcaModification(
            @RequestBody Map<String, String> request) {
        try {
            String serie = request.get("serie");
            String chno = request.get("chno");
            if (serie == null || chno == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Invalid chassis information."));
            }
            List<Map<String, Object>> list = saveModificationsMapper.selectModificationData(serie, chno);

            Map<String, Object> data = new LinkedHashMap<>();
            if (list != null && !list.isEmpty()) {
                Map<String, Object> first = list.get(0);
                data.put("doctype", first.get("DOCTYPE"));
                data.put("version", String.valueOf(first.get("VERS")));

                List<Map<String, String>> modifications = new ArrayList<>();
                boolean hasUnreleased = false;
                for (Map<String, Object> item : list) {
                    Map<String, String> mod = new LinkedHashMap<>();
                    mod.put("variable", (String) item.get("VARIABLE"));
                    mod.put("newVal", (String) item.get("NEWVAL"));
                    modifications.add(mod);
                }
                data.put("modifications", modifications);
                data.put("hasUnreleasedVersion", hasUnreleased);
            } else {
                data.put("doctype", "");
                data.put("version", "");
                data.put("modifications", new ArrayList<>());
                data.put("hasUnreleasedVersion", false);
            }
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
