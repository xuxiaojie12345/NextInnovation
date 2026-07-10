package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD08HomologationVariablesService;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud09")
@CrossOrigin(origins = "*")
public class UD09Controller {

  private static final Logger log = LoggerFactory.getLogger(UD09Controller.class);

  @Autowired
  private UD08HomologationVariablesService service;

  @PostMapping("/search")
  public ResponseEntity<ApiResponse<Map<String, Object>>> search(
      @RequestBody Map<String, Object> request) {
    try {
      // 从 conditions 数组中解析每个条件的 label、operator、value
      @SuppressWarnings("unchecked")
      List<Map<String, String>> conditions = (List<Map<String, String>>) request.get("conditions");

      String pc = null, num = null, market = null;
      String variable = null, valField = null, vs = null;
      String comments = null, addDate = null, deleteDate = null;
      String createdBy = null, date = null;
      String pcOp1 = "=", numOp1 = "=", marketOp1 = "=";
      String variableOp1 = "=", valOp1 = "=", vsOp1 = "=";
      String commentsOp1 = "=", addDateOp1 = "=", deleteDateOp1 = "=";
      String createdByOp1 = "=", dateOp1 = "=";
      // 仅 Variant string 使用双条件
      String vsOp2 = "=";
      String vsVal2 = null;

      if (conditions != null) {
        for (Map<String, String> cond : conditions) {
          String label = cond.get("label");
          String op = cond.get("operator");
          String rawVal = cond.get("value");
          // Variant string 用双条件字段名
          String op1 = cond.get("operator1");
          String v1 = cond.get("value1");
          String op2 = cond.get("operator2");
          String v2 = cond.get("value2");
          switch (label) {
            case "Product class":
              if (rawVal != null && !rawVal.isEmpty()) {
                pc = rawVal;
                pcOp1 = op;
              }
              break;
            case "Number":
              if (rawVal != null && !rawVal.isEmpty()) {
                num = rawVal;
                numOp1 = op;
              }
              break;
            case "Market":
              if (rawVal != null && !rawVal.isEmpty()) {
                market = rawVal;
                marketOp1 = op;
              }
              break;
            case "Variable":
              if (rawVal != null && !rawVal.isEmpty()) {
                variable = rawVal;
                variableOp1 = op;
              }
              break;
            case "Value":
              if (rawVal != null && !rawVal.isEmpty()) {
                valField = rawVal;
                valOp1 = op;
              }
              break;
            case "Variant string":
              if (v1 != null && !v1.isEmpty()) {
                vs = v1;
                vsOp1 = op1;
              }
              if (v2 != null && !v2.isEmpty()) {
                vsVal2 = v2;
                vsOp2 = op2;
              }
              break;
            case "Comments":
              if (rawVal != null && !rawVal.isEmpty()) {
                comments = rawVal;
                commentsOp1 = op;
              }
              break;
            case "Add":
              if (rawVal != null && !rawVal.isEmpty()) {
                addDate = rawVal;
                addDateOp1 = op;
              }
              break;
            case "Delete":
              if (rawVal != null && !rawVal.isEmpty()) {
                deleteDate = rawVal;
                deleteDateOp1 = op;
              }
              break;
            case "Created by user":
              if (rawVal != null && !rawVal.isEmpty()) {
                createdBy = rawVal;
                createdByOp1 = op;
              }
              break;
            case "Date":
              if (rawVal != null && !rawVal.isEmpty()) {
                date = rawVal;
                dateOp1 = op;
              }
              break;
            default:
              break;
          }
        }
      }

      List<Map<String, Object>> list =
          service.searchRules(
              pc,
              num,
              market,
              variable,
              valField,
              pcOp1,
              numOp1,
              marketOp1,
              variableOp1,
              valOp1,
              vs,
              vsOp1,
              vsOp2,
              vsVal2,
              comments,
              commentsOp1,
              addDate,
              addDateOp1,
              deleteDate,
              deleteDateOp1,
              createdBy,
              createdByOp1,
              date,
              dateOp1);
      Map<String, Object> data = new HashMap<>();
      List<Map<String, Object>> ruleList = new ArrayList<>();
      for (Map<String, Object> row : list) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("pc", row.get("PC"));
        item.put("num", row.get("num"));
        item.put("market", row.get("MARKET"));
        item.put("variable", row.get("VARIABLE"));
        item.put("val", row.get("VAL"));
        item.put("vs", row.get("VS"));
        item.put("vs2", row.get("VS2"));
        item.put("comments", row.get("COMMENTS"));
        item.put("addDate", row.get("ADD_DATE"));
        item.put("deleteDate", row.get("DELETE_DATE"));
        item.put("updateUser", row.get("REGISTER_USER"));
        item.put(
            "updateDatetime",
            row.get("REGISTER_DATETIME") != null ? row.get("REGISTER_DATETIME").toString() : null);
        ruleList.add(item);
      }
      data.put("ruleList", ruleList);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      log.error("search error", e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @RequestMapping(
      value = "/deleteSelected",
      method = {RequestMethod.POST, RequestMethod.DELETE})
  public ResponseEntity<ApiResponse<Map<String, Object>>> deleteSelected(
      @RequestBody Map<String, Object> request) {
    try {
      @SuppressWarnings("unchecked")
      List<Map<String, Object>> records = (List<Map<String, Object>>) request.get("records");
      if (records == null || records.isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "No records to delete."));
      }

      List<Map<String, Object>> rules = new ArrayList<>();
      for (Map<String, Object> rec : records) {
        Map<String, Object> rule = new HashMap<>();
        rule.put("pc", String.valueOf(rec.get("pc")));
        rule.put("num", String.valueOf(rec.get("num")));
        rule.put("market", String.valueOf(rec.get("market")));
        rules.add(rule);
      }

      int count = service.deleteSelectedRules(rules);
      Map<String, Object> data = new HashMap<>();
      data.put("deleteCount", count);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      log.error("deleteSelected error", e);
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }
}
