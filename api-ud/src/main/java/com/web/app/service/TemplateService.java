package com.web.app.service;

import java.util.List;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;

public interface TemplateService {
  List<String> selectAllMarkets();

  List<Map<String, Object>> listTemplates(String market);

  String uploadFile(MultipartFile file, String market);

  String deleteFile(String fileName, String market);

  org.springframework.core.io.Resource downloadFile(String fileName, String market);
}
