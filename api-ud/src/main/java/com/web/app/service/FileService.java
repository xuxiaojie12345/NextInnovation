package com.web.app.service;

import com.web.app.dto.response.TemplateFileInfoResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface FileService {
    void uploadFile(MultipartFile file, String market);
    void deleteFile(String market, String fileName);
    List<String> getTemplatesByMarket(String market);
    List<TemplateFileInfoResponse> getTemplateFileInfos(String market, List<String> variables);
}
