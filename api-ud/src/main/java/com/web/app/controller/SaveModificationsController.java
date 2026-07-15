package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.service.SaveModificationsService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class SaveModificationsController extends BaseController {

  @Autowired
  private SaveModificationsService saveModificationsService;

  @PostMapping("/adcamodification")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getAdcaModification(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chno = request.get("chno");
      if (isParamMissing(serie) || isParamMissing(chno)) {
        return badRequest(MessageConstants.INVALID_CHASSIS_INFO);
      }
      List<Map<String, Object>> list = saveModificationsService.selectModificationData(serie, chno);

      Map<String, Object> data = new LinkedHashMap<>();
      if (list != null && !list.isEmpty()) {
        Map<String, Object> first = list.get(0);
        data.put("doctype", first.get("DOCTYPE"));
        data.put("version", String.valueOf(first.get("VERS")));

        List<Map<String, String>> modifications = new ArrayList<>();
        for (Map<String, Object> item : list) {
          Map<String, String> mod = new LinkedHashMap<>();
          mod.put("variable", (String) item.get("VARIABLE"));
          mod.put("newVal", (String) item.get("NEWVAL"));
          modifications.add(mod);
        }
        data.put("modifications", modifications);
        data.put("hasUnreleasedVersion", false);
      } else {
        data.put("doctype", "");
        data.put("version", "");
        data.put("modifications", new ArrayList<>());
        data.put("hasUnreleasedVersion", false);
      }
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }
}
