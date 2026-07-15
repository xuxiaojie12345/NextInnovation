package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import com.web.app.service.UD08HomologationVariablesService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud08")
@CrossOrigin(origins = "*")
public class UD08HomologationVariablesController {

  private static final Logger log =
      LoggerFactory.getLogger(UD08HomologationVariablesController.class);

  @Autowired
  private UD08HomologationVariablesService service;

  @PostMapping("/productclass")
  public ResponseEntity<ApiResponse<List<ProductClassMaster>>> selectProductClass() {
    try {
      List<ProductClassMaster> list = service.selectProductClassMaster();
      return ResponseEntity.ok(ApiResponse.success(list));
    } catch (Exception e) {
      log.error("selectProductClass error", e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/market")
  public ResponseEntity<ApiResponse<List<MarketMaster>>> selectMarket() {
    try {
      List<MarketMaster> list = service.selectMarketMaster();
      return ResponseEntity.ok(ApiResponse.success(list));
    } catch (Exception e) {
      log.error("selectMarket error", e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/checkVariable")
  public ResponseEntity<ApiResponse<Map<String, Object>>> checkVariable(
      @RequestBody Map<String, String> request) {
    try {
      String variable = request.get("variable");
      if (variable == null || variable.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "Variable is required."));
      }
      boolean exists = service.checkVariable(variable.trim());
      Map<String, Object> data = new HashMap<>();
      data.put("variable", variable.trim());
      data.put("exists", exists);
      data.put("count", exists ? 1 : 0);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/checkRule")
  public ResponseEntity<ApiResponse<Map<String, Object>>> checkRule(
      @RequestBody Map<String, String> request) {
    try {
      String pc = request.get("pc");
      String num = request.get("num");
      String market = request.get("market");
      if (pc == null || num == null || market == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "pc, num and market are required."));
      }
      boolean exists = service.checkRule(pc, num, market);
      Map<String, Object> data = new HashMap<>();
      data.put("pc", pc);
      data.put("num", num);
      data.put("market", market);
      data.put("exists", exists);
      data.put("count", exists ? 1 : 0);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      log.error("checkRule error", e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/add")
  public ResponseEntity<ApiResponse<Map<String, String>>> addRule(
      @RequestBody HdocUserDefinedRules rule) {
    try {
      if (rule.getPc() == null || rule.getNum() == null || rule.getMarket() == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "pc, num and market are required."));
      }
      int result = service.addRule(rule);
      if (result > 0) {
        Map<String, String> data = new HashMap<>();
        data.put("pc", rule.getPc());
        data.put("num", rule.getNum());
        data.put("market", rule.getMarket());
        return ResponseEntity.ok(ApiResponse.success(data));
      } else {
        return ResponseEntity.status(500).body(ApiResponse.error(500, "Failed to add rule."));
      }
    } catch (Exception e) {
      log.error(
          "addRule error: pc={}, num={}, market={}",
          rule.getPc(),
          rule.getNum(),
          rule.getMarket(),
          e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/update")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateRule(
      @RequestBody HdocUserDefinedRules rule) {
    try {
      if (rule.getPc() == null || rule.getNum() == null || rule.getMarket() == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "pc, num and market are required."));
      }
      int result = service.updateRule(rule);
      Map<String, Object> data = new HashMap<>();
      data.put("pc", rule.getPc());
      data.put("num", rule.getNum());
      data.put("market", rule.getMarket());
      data.put("updateRows", result);
      if (result > 0) {
        return ResponseEntity.ok(ApiResponse.success(data));
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Data does not exist, Please enter the correct content."));
      }
    } catch (Exception e) {
      log.error(
          "updateRule error: pc={}, num={}, market={}",
          rule.getPc(),
          rule.getNum(),
          rule.getMarket(),
          e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/delete")
  public ResponseEntity<ApiResponse<Map<String, Object>>> deleteRule(
      @RequestBody Map<String, String> request) {
    try {
      String pc = request.get("pc");
      String num = request.get("num");
      String market = request.get("market");
      if (pc == null || num == null || market == null) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "pc, num and market are required."));
      }
      int result = service.deleteRule(pc, num, market);
      Map<String, Object> data = new HashMap<>();
      data.put("pc", pc);
      data.put("num", num);
      data.put("market", market);
      data.put("deleteRows", result);
      if (result > 0) {
        return ResponseEntity.ok(ApiResponse.success(data));
      } else {
        return ResponseEntity.status(404)
            .body(ApiResponse.error(404, "Data does not exist, Please enter the correct content."));
      }
    } catch (Exception e) {
      log.error("deleteRule error", e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }
}
