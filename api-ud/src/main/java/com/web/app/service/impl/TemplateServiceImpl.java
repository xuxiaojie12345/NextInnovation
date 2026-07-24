package com.web.app.service.impl;

import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.TemplateService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TemplateServiceImpl implements TemplateService {

  @Value("${file.template.uploadDir}")
  private String uploadDir;

  @Value("${file.template.username}")
  private String shareUsername;

  @Value("${file.template.password}")
  private String sharePassword;

  @Autowired
  private MarketMasterMapper marketMasterMapper;

  /** 认证网络共享连接（Windows UNC 路径） */
  private void authenticateShare() {
    if (uploadDir.startsWith("//") || uploadDir.startsWith("\\\\")) {
      try {
        String shareRoot = uploadDir.replace("/", "\\");
        int idx = shareRoot.indexOf("\\", 2);
        if (idx > 0) {
          shareRoot = shareRoot.substring(0, idx);
        }
        // 先断开已有连接，再重新认证
        Runtime.getRuntime().exec(new String[] {"cmd", "/c", "net use", shareRoot, "/delete", "/y"}).waitFor();
        Process process = Runtime.getRuntime().exec(
            new String[] {"cmd", "/c", "net use", shareRoot, sharePassword, "/user:" + shareUsername});
        process.waitFor();
      } catch (Exception e) {
        // 认证失败不影响后续操作，让 Java 自行处理
      }
    }
  }

  /**
   * 校验文件名/市场名是否包含路径遍历字符，防止 Path Traversal 攻击
   *
   * @param name 待校验的文件名或市场名
   * @throws RuntimeException 如果检测到路径遍历字符则抛出
   */
  private void validateNoPathTraversal(String name) {
    if (name == null || name.isEmpty()) {
      return;
    }
    // 检查常见的路径遍历模式
    if (name.contains("..") || name.contains("./") || name.contains(".\\")
        || name.startsWith("/") || name.startsWith("\\")
        || name.contains("~")) {
      throw new RuntimeException("Invalid file name: path traversal characters are not allowed.");
    }
  }

  @Override
  public List<String> selectAllMarkets() {
    return marketMasterMapper.selectAllMarketCodes();
  }

  @Override
  public List<Map<String, Object>> listTemplates(String market) {
    authenticateShare();
    validateNoPathTraversal(market);

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
                    long lastModified = file.lastModified();
                    if (lastModified > 0) {
                      java.text.SimpleDateFormat sdf =
                          new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm");
                      fileInfo.put("lastMod", sdf.format(new java.util.Date(lastModified)));
                    } else {
                      fileInfo.put("lastMod", "-");
                    }
                    long fileSize = file.length();
                    String sizeStr =
                        fileSize > 0 ? String.format("%.1f", fileSize / 1024.0) + " Kb" : "-";
                    fileInfo.put("size", sizeStr);
                    return fileInfo;
                  })
              .collect(Collectors.toList());
    }
    return templates;
  }

  @Override
  public String uploadFile(MultipartFile file, String market) {
    authenticateShare();
    try {
      String originalFilename = file.getOriginalFilename();
      validateNoPathTraversal(originalFilename);
      validateNoPathTraversal(market);
      String marketDir = uploadDir + "/" + market;
      File dir = new File(marketDir);
      if (!dir.exists()) {
        dir.mkdirs();
      }
      String filePath = marketDir + "/" + originalFilename;
      file.transferTo(new File(filePath));
      return "TEMPLATE " + originalFilename + " WAS SUCCESSFULLY UPLOADED TO MARKET " + market;
    } catch (IOException e) {
      throw new RuntimeException("File upload failed: " + e.getMessage());
    }
  }

  @Override
  public String deleteFile(String fileName, String market) {
    authenticateShare();
    validateNoPathTraversal(fileName);
    validateNoPathTraversal(market);
    try {
      String filePath = uploadDir + "/" + market + "/" + fileName;
      Path path = Paths.get(filePath);
      if (Files.exists(path)) {
        Files.delete(path);
        return "TEMPLATE " + fileName + " WAS SUCCESSFULLY DELETED FROM MARKET " + market;
      } else {
        throw new RuntimeException("File not found: " + filePath);
      }
    } catch (IOException e) {
      throw new RuntimeException("File deletion failed: " + e.getMessage());
    }
  }

  @Override
  public Resource downloadFile(String fileName, String market) {
    authenticateShare();
    validateNoPathTraversal(fileName);
    validateNoPathTraversal(market);
    String filePath = uploadDir + "/" + market + "/" + fileName;
    Path path = Paths.get(filePath);
    if (!Files.exists(path)) {
      throw new RuntimeException("File not found: " + filePath);
    }
    return new FileSystemResource(path.toFile());
  }
}
