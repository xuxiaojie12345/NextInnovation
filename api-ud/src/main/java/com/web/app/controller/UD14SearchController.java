package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD14SearchService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud14")
@CrossOrigin(origins = "*")
public class UD14SearchController extends BaseController {

  @Autowired
  private UD14SearchService ud14SearchService;

  @PostMapping("/selectMarketmaster")
  public ResponseEntity<ApiResponse<Map<String, Object>>> selectMarketmaster() {
    try {
      List<String> marketList = ud14SearchService.selectAllMarkets();
      Map<String, Object> data = new HashMap<>();
      data.put("marketList", marketList);
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/selectHdocUserDefinedRules")
  public ResponseEntity<ApiResponse<Map<String, Object>>> selectHdocUserDefinedRules(
      @RequestBody Map<String, String> request) {
    try {
      String market = request.get("market");
      String filename = request.get("filename");

      if (isParamMissing(market) || isParamMissing(filename)) {
        return badRequest("Market and filename are required.");
      }

      List<String> variableList =
          ud14SearchService.selectVariablesByMarketAndFile(market, filename);
      Map<String, Object> data = new HashMap<>();
      data.put("variableList", variableList);
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }
}
