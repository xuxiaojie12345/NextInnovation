package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/hdoc/template")
@CrossOrigin(origins = "*")
public class TemplateCheckController extends BaseController {

  @Value("${file.template.checkResultDir}")
  private String checkResultDir;

  @PostMapping("/check")
  public ResponseEntity<ApiResponse<Map<String, Object>>> checkTemplate(
      @RequestParam("file") MultipartFile file) {
    try {
      if (file.isEmpty()) {
        return badRequest("ERROR: Unable to access file!");
      }

      String content = new String(file.getBytes(), StandardCharsets.UTF_8);

      Pattern pattern = Pattern.compile("\\$([^\\$]+)\\$");
      Matcher matcher = pattern.matcher(content);
      List<String> variables = new ArrayList<>();
      while (matcher.find()) {
        String varName = matcher.group(1).trim();
        if (!varName.isEmpty() && !variables.contains(varName)) {
          variables.add(varName);
        }
      }

      int variableCount = variables.size();

      if (variableCount == 0) {
        return unprocessableEntity("ERROR: The file content is incorrect!");
      }

      String resultId = UUID.randomUUID().toString().replace("-", "");
      String downloadUrl = "/api/v1/hdoc/template/check/result/" + resultId;

      File dir = new File(checkResultDir);
      if (!dir.exists()) dir.mkdirs();

      Path resultPath = Paths.get(checkResultDir, resultId + ".csv");
      try (BufferedWriter writer = Files.newBufferedWriter(resultPath, StandardCharsets.UTF_8)) {
        writer.write("Variable Count: " + variableCount + "\n");
        writer.write("Variable Name\n");
        for (String var : variables) {
          writer.write(var + "\n");
        }
      }

      Map<String, Object> data = new HashMap<>();
      data.put("variableCount", variableCount);
      data.put("variables", variables);
      data.put("downloadUrl", downloadUrl);

      return ok(data);
    } catch (Exception e) {
      return systemError();
    }
  }

  @GetMapping("/check/result/{id}")
  public ResponseEntity<?> downloadCheckResult(@PathVariable("id") String id) {
    try {
      Path filePath = Paths.get(checkResultDir, id + ".csv");
      if (!Files.exists(filePath)) {
        return notFound("Result file not found.");
      }

      byte[] content = Files.readAllBytes(filePath);
      String fileName =
          "template_check_result_"
              + new java.text.SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date())
              + ".csv";

      return ResponseEntity.ok()
          .header("Content-Type", "text/csv; charset=UTF-8")
          .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
          .body(content);
    } catch (Exception e) {
      return systemError();
    }
  }
}
