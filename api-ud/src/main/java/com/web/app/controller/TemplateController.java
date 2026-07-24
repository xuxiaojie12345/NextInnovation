package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.service.TemplateService;
import java.io.File;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/hdoc/template")
@CrossOrigin(origins = "*")
public class TemplateController extends BaseController {

  @Value("${file.template.uploadDir}")
  private String uploadDir;

  @Autowired
  private TemplateService templateService;

  @PostMapping("/selectMarket")
  public ResponseEntity<ApiResponse<Map<String, Object>>> selectMarket() {
    try {
      List<String> marketList = templateService.selectAllMarkets();
      Map<String, Object> data = new HashMap<>();
      data.put("marketList", marketList);
      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/upload")
  public ResponseEntity<ApiResponse<Object>> uploadFile(
      @RequestParam("file") MultipartFile file, @RequestParam("market") String market) {
    try {
      if (file.isEmpty()) {
        return badRequest(MessageConstants.FILE_IS_EMPTY);
      }
      if (isParamMissing(market)) {
        return badRequest("Market is required.");
      }

      String message = templateService.uploadFile(file, market);
      Map<String, Object> response = new HashMap<>();
      response.put("message", message);
      return ok(response);
    } catch (Exception e) {
      return systemError();
    }
  }

  @PostMapping("/delete")
  public ResponseEntity<ApiResponse<Object>> deleteFile(@RequestBody Map<String, String> request) {
    try {
      String fileName = request.get("fileName");
      String market = request.get("market");

      if (isParamMissing(fileName)) {
        return badRequest("File name is required.");
      }
      if (isParamMissing(market)) {
        return badRequest("Market is required.");
      }

      String message = templateService.deleteFile(fileName, market);
      Map<String, Object> response = new HashMap<>();
      response.put("message", message);
      return ok(response);
    } catch (RuntimeException e) {
      if (e.getMessage() != null && e.getMessage().contains("path traversal")) {
        return badRequest(e.getMessage());
      }
      return systemError();
    }
  }

  @PostMapping("/listTemplates")
  public ResponseEntity<ApiResponse<Map<String, Object>>> listTemplates(
      @RequestBody Map<String, String> request) {
    try {
      String market = request.get("market");
      if (isParamMissing(market)) {
        return badRequest("Market is required.");
      }

      List<Map<String, Object>> templates = templateService.listTemplates(market);
      if (templates.isEmpty()) {
        String dirPath = uploadDir + "/" + market;
        File dir = new File(dirPath);
        if (!dir.exists() || !dir.isDirectory()) {
          return badRequest(MessageConstants.MARKET_FOLDER_NOT_FOUND);
        }
      }

      Map<String, Object> data = new HashMap<>();
      data.put("templateList", templates);
      return ok(data);
    } catch (RuntimeException e) {
      if (e.getMessage() != null && e.getMessage().contains("path traversal")) {
        return badRequest(e.getMessage());
      }
      return systemError();
    }
  }

  @PostMapping("/download")
  public ResponseEntity<?> downloadFile(@RequestBody Map<String, String> request) {
    try {
      String fileName = request.get("fileName");
      String market = request.get("market");

      if (isParamMissing(fileName)) {
        return badRequest("File name is required.");
      }
      if (isParamMissing(market)) {
        return badRequest("Market is required.");
      }

      Resource resource = templateService.downloadFile(fileName, market);

      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_OCTET_STREAM)
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
          .body(resource);
    } catch (RuntimeException e) {
      if (e.getMessage() != null && e.getMessage().contains("path traversal")) {
        return badRequest(e.getMessage());
      }
      return systemError(MessageConstants.FILE_NOT_FOUND);
    }
  }
}
