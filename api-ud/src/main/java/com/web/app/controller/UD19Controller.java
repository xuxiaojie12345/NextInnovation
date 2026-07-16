package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD19Service;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud19")
@CrossOrigin(origins = "*")
public class UD19Controller extends BaseController {

  @Autowired
  private UD19Service ud19Service;

  @PostMapping("/selectMarketMaster")
  public ResponseEntity<ApiResponse<Map<String, Object>>> selectMarketMaster() {
    try {
      List<String> marketList = ud19Service.selectAllMarkets();
      Map<String, Object> data = new HashMap<>();
      data.put("marketList", marketList);
      return ok(data);
    } catch (Exception e) {
      return systemError();
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
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }
}
