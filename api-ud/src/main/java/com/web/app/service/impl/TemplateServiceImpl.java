package com.web.app.service.impl;

import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.TemplateService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
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

  @Override
  public List<String> selectAllMarkets() {
    return marketMasterMapper.selectAllMarketCodes();
  }

  @Override
  public String uploadFile(MultipartFile file, String market) {
    authenticateShare();
    try {
      String originalFilename = file.getOriginalFilename();
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
    String filePath = uploadDir + "/" + market + "/" + fileName;
    Path path = Paths.get(filePath);
    if (!Files.exists(path)) {
      throw new RuntimeException("File not found: " + filePath);
    }
    return new FileSystemResource(path.toFile());
  }
}
