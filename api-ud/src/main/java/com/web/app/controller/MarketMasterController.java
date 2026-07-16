package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.service.MarketMasterService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud21")
@CrossOrigin(origins = "*")
public class MarketMasterController extends BaseController {

  @Autowired
  private MarketMasterService marketMasterService;

  @PostMapping("/markets")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getMarkets() {
    try {
      List<MarketMaster> marketList = marketMasterService.selectAllMarkets();
      Map<String, Object> data = new HashMap<>();
      data.put("marketList", marketList != null ? marketList : new ArrayList<>());
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }
}
