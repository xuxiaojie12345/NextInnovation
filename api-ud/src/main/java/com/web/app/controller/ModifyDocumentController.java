package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.service.ModifyDocumentService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class ModifyDocumentController extends BaseController {

  @Autowired
  private ModifyDocumentService modifyDocumentService;

  @PostMapping("/modifydocument/select")
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> selectModifications(
      @RequestBody Map<String, String> request) {
    try {
      String serie = request.get("serie");
      String chnr = request.get("chnr");
      if (isParamMissing(serie) || isParamMissing(chnr)) {
        return badRequest(MessageConstants.INVALID_CHASSIS_INFO);
      }
      List<Map<String, Object>> list = modifyDocumentService.selectModifications(serie, chnr);
      List<Map<String, Object>> result = new ArrayList<>();
      for (Map<String, Object> item : list) {
        Map<String, Object> transformed = new LinkedHashMap<>();
        transformed.put("variable", item.get("VARIABLE"));
        transformed.put("description", item.get("DESCRIPTION"));
        transformed.put("newVal", item.get("NEWVAL"));
        result.add(transformed);
      }
      return ok(result);
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/modifydocument/update")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateModifications(
      @RequestBody Map<String, Object> request) {
    try {
      String serie = (String) request.get("serie");
      String chnr = (String) request.get("chnr");
      String currentUser = (String) request.get("currentUser");
      @SuppressWarnings("unchecked")
      List<Map<String, String>> modifications =
          (List<Map<String, String>>) request.get("modifications");

      if (isParamMissing(serie) || isParamMissing(chnr) || modifications == null || modifications.isEmpty()) {
        return badRequest(MessageConstants.INVALID_REQUEST_PARAMS);
      }

      int count = modifyDocumentService.updateModifications(serie, chnr, modifications, currentUser);
      Map<String, Object> data = new HashMap<>();
      data.put("updateCount", count);
      return ok(data, MessageConstants.VARIABLES_UPDATED_SUCCESS);
    } catch (Exception e) {
      return systemError();
    }
  }
}
