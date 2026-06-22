package com.web.app.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TemplateService {
    List<String> selectAllMarkets();
    String uploadFile(MultipartFile file, String market);
    String deleteFile(String fileName, String market);
    org.springframework.core.io.Resource downloadFile(String fileName, String market);
}
