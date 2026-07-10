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
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TemplateServiceImpl implements TemplateService {

  private static final String UPLOAD_DIR = "//172.17.0.63/hdoc/template/upload";

  @Autowired
  private MarketMasterMapper marketMasterMapper;

  @Override
  public List<String> selectAllMarkets() {
    return marketMasterMapper.selectAllMarketCodes();
  }

  @Override
  public String uploadFile(MultipartFile file, String market) {
    try {
      String originalFilename = file.getOriginalFilename();
      String marketDir = UPLOAD_DIR + "/" + market;
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
    try {
      String filePath = UPLOAD_DIR + "/" + market + "/" + fileName;
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
    String filePath = UPLOAD_DIR + "/" + market + "/" + fileName;
    Path path = Paths.get(filePath);
    if (!Files.exists(path)) {
      throw new RuntimeException("File not found: " + filePath);
    }
    return new FileSystemResource(path.toFile());
  }
}
