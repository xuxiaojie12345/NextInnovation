package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.TemplateService;
import java.io.File;
import java.util.*;
import java.util.stream.Collectors;
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
public class TemplateController {

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
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/upload")
  public ResponseEntity<ApiResponse<Object>> uploadFile(
      @RequestParam("file") MultipartFile file, @RequestParam("market") String market) {
    try {
      if (file.isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "File is empty."));
      }
      if (market == null || market.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "Market is required."));
      }

      String message = templateService.uploadFile(file, market);
      Map<String, Object> response = new HashMap<>();
      response.put("message", message);
      return ResponseEntity.ok(ApiResponse.success(response));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/delete")
  public ResponseEntity<ApiResponse<Object>> deleteFile(@RequestBody Map<String, String> request) {
    try {
      String fileName = request.get("fileName");
      String market = request.get("market");

      if (fileName == null || fileName.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "File name is required."));
      }
      if (market == null || market.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "Market is required."));
      }

      String message = templateService.deleteFile(fileName, market);
      Map<String, Object> response = new HashMap<>();
      response.put("message", message);
      return ResponseEntity.ok(ApiResponse.success(response));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/listTemplates")
  public ResponseEntity<ApiResponse<Map<String, Object>>> listTemplates(
      @RequestBody Map<String, String> request) {
    try {
      String market = request.get("market");
      if (market == null || market.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "Market is required."));
      }

      String dirPath = uploadDir + "/" + market;
      File dir = new File(dirPath);
      List<Map<String, Object>> templates = new ArrayList<>();
      if (dir.exists() && dir.isDirectory()) {
        templates =
            Arrays.stream(Objects.requireNonNull(dir.listFiles()))
                .filter(File::isFile)
                .map(
                    file -> {
                      Map<String, Object> fileInfo = new HashMap<>();
                      fileInfo.put("filename", file.getName());
                      // 最后修改时间 yyyy-MM-dd HH:mm
                      long lastModified = file.lastModified();
                      if (lastModified > 0) {
                        java.text.SimpleDateFormat sdf =
                            new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm");
                        fileInfo.put("lastMod", sdf.format(new java.util.Date(lastModified)));
                      } else {
                        fileInfo.put("lastMod", "-");
                      }
                      // 文件大小 KB
                      long fileSize = file.length();
                      String sizeStr =
                          fileSize > 0 ? String.format("%.1f", fileSize / 1024.0) + " KB" : "-";
                      fileInfo.put("size", sizeStr);
                      return fileInfo;
                    })
                .collect(Collectors.toList());
      } else {
        return ResponseEntity.ok(ApiResponse.error(400, "Market folder not found."));
      }

      Map<String, Object> data = new HashMap<>();
      data.put("templateList", templates);
      return ResponseEntity.ok(ApiResponse.success(data));
    } catch (Exception e) {
      return ResponseEntity.status(500)
          .body(ApiResponse.error(500, "System error. Please contact administrator."));
    }
  }

  @PostMapping("/download")
  public ResponseEntity<?> downloadFile(@RequestBody Map<String, String> request) {
    try {
      String fileName = request.get("fileName");
      String market = request.get("market");

      if (fileName == null || fileName.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "File name is required."));
      }
      if (market == null || market.trim().isEmpty()) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "Market is required."));
      }

      Resource resource = templateService.downloadFile(fileName, market);

      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_OCTET_STREAM)
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
          .body(resource);
    } catch (Exception e) {
      return ResponseEntity.status(500).body(ApiResponse.error(500, "File not found."));
    }
  }
}
