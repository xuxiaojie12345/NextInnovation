package com.web.app.controller;

import com.web.app.constant.MessageConstants;
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
public class UD08HomologationVariablesController extends BaseController {

  private static final Logger log =
      LoggerFactory.getLogger(UD08HomologationVariablesController.class);

  @Autowired
  private UD08HomologationVariablesService service;

  @PostMapping("/productclass")
  public ResponseEntity<ApiResponse<List<ProductClassMaster>>> selectProductClass() {
    try {
      List<ProductClassMaster> list = service.selectProductClassMaster();
      return ok(list);
    } catch (Exception e) {
      log.error("selectProductClass error", e);
      return systemError();
    }
  }

  @PostMapping("/market")
  public ResponseEntity<ApiResponse<List<MarketMaster>>> selectMarket() {
    try {
      List<MarketMaster> list = service.selectMarketMaster();
      return ok(list);
    } catch (Exception e) {
      log.error("selectMarket error", e);
      return systemError();
    }
  }

  @PostMapping("/checkVariable")
  public ResponseEntity<ApiResponse<Map<String, Object>>> checkVariable(
      @RequestBody Map<String, String> request) {
    try {
      String variable = request.get("variable");
      if (isParamMissing(variable)) {
        return badRequest(MessageConstants.VARIABLE_REQUIRED);
      }
      boolean exists = service.checkVariable(variable.trim());
      Map<String, Object> data = new HashMap<>();
      data.put("variable", variable.trim());
      data.put("exists", exists);
      data.put("count", exists ? 1 : 0);
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/checkRule")
  public ResponseEntity<ApiResponse<Map<String, Object>>> checkRule(
      @RequestBody Map<String, String> request) {
    try {
      String pc = request.get("pc");
      String num = request.get("num");
      String market = request.get("market");
      if (isParamMissing(pc) || isParamMissing(num) || isParamMissing(market)) {
        return badRequest("pc, num and market are required.");
      }
      boolean exists = service.checkRule(pc, num, market);
      Map<String, Object> data = new HashMap<>();
      data.put("pc", pc);
      data.put("num", num);
      data.put("market", market);
      data.put("exists", exists);
      data.put("count", exists ? 1 : 0);
      return ok(data);
    } catch (Exception e) {
      log.error("checkRule error", e);
      return systemError();
    }
  }

  @PostMapping("/add")
  public ResponseEntity<ApiResponse<Map<String, String>>> addRule(
      @RequestBody HdocUserDefinedRules rule) {
    try {
      if (rule.getPc() == null || rule.getNum() == null || rule.getMarket() == null) {
        return badRequest("pc, num and market are required.");
      }
      int result = service.addRule(rule);
      if (result > 0) {
        Map<String, String> data = new HashMap<>();
        data.put("pc", rule.getPc());
        data.put("num", rule.getNum());
        data.put("market", rule.getMarket());
        return ok(data);
      } else {
        return systemError(MessageConstants.FAILED_TO_ADD_RULE);
      }
    } catch (Exception e) {
      log.error("addRule error: pc={}, num={}, market={}", rule.getPc(), rule.getNum(), rule.getMarket(), e);
      return systemError();
    }
  }

  @PostMapping("/update")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateRule(
      @RequestBody HdocUserDefinedRules rule) {
    try {
      if (rule.getPc() == null || rule.getNum() == null || rule.getMarket() == null) {
        return badRequest(MessageConstants.PC_NUM_MARKET_REQUIRED);
      }
      int result = service.updateRule(rule);
      Map<String, Object> data = new HashMap<>();
      data.put("pc", rule.getPc());
      data.put("num", rule.getNum());
      data.put("market", rule.getMarket());
      data.put("updateRows", result);
      if (result > 0) {
        return ok(data);
      } else {
        return notFound(MessageConstants.DATA_NOT_EXISTS);
      }
    } catch (Exception e) {
      log.error("updateRule error: pc={}, num={}, market={}", rule.getPc(), rule.getNum(), rule.getMarket(), e);
      return systemError();
    }
  }

  @PostMapping("/delete")
  public ResponseEntity<ApiResponse<Map<String, Object>>> deleteRule(
      @RequestBody Map<String, String> request) {
    try {
      String pc = request.get("pc");
      String num = request.get("num");
      String market = request.get("market");
      if (isParamMissing(pc) || isParamMissing(num) || isParamMissing(market)) {
        return badRequest("pc, num and market are required.");
      }
      int result = service.deleteRule(pc, num, market);
      Map<String, Object> data = new HashMap<>();
      data.put("pc", pc);
      data.put("num", num);
      data.put("market", market);
      data.put("deleteRows", result);
      if (result > 0) {
        return ok(data);
      } else {
        return notFound(MessageConstants.DATA_NOT_EXISTS);
      }
    } catch (Exception e) {
      log.error("deleteRule error", e);
      return systemError();
    }
  }
}
