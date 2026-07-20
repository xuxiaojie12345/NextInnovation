package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.service.ADChangeService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/adca")
@CrossOrigin(origins = "*")
public class ADChangeController extends BaseController {

  @Autowired
  private ADChangeService adChangeService;

  @PostMapping("/select")
  public ResponseEntity<ApiResponse<Map<String, Object>>> selectHdocAdcaChange(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");

      if (isParamMissing(serie) || isParamMissing(chnr)) {
        return badRequest(MessageConstants.SERIE_CHNR_REQUIRED);
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
      return ok(data);
    } catch (Exception e) {
      return systemError();
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
      String updateUser = request.get("updateUser");

      if (isParamMissing(serie) || isParamMissing(chnr) || isParamMissing(act)) {
        return badRequest(MessageConstants.SERIE_CHNR_ACT_REQUIRED);
      }

      int result = adChangeService.insert(serie, chnr, act, bu, reason, updateUser);
      if (result > 0) {
        Map<String, Object> data = new HashMap<>();
        data.put("serie", serie);
        data.put("chnr", chnr);
        data.put("act", act);
        return ok(data);
      } else {
        return systemError(MessageConstants.FAILED_TO_INSERT_ADCA);
      }
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/update")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateHdocAdcaChange(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");
      String updateUser = request.get("updateUser");
      int updateCount = adChangeService.updateAllActToN(serie, chnr, updateUser);
      if (updateCount == 0) {
        return notFound(MessageConstants.FAILED_TO_UPDATE_ADCA);
      }
      Map<String, Object> data = new HashMap<>();
      data.put("updateCount", String.valueOf(updateCount));
      data.put("updateContent", MessageConstants.ACT_STATUS_UPDATED);
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }
}
