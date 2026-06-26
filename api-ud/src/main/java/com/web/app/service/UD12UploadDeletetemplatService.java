package com.web.app.service;

import com.web.app.dto.MarketListResponse;
import com.web.app.dto.TemplateListResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface UD12UploadDeletetemplatService {
    List<MarketListResponse> selectMarket();
    TemplateListResponse getTemplates();
    void uploadTemplate(MultipartFile file, String fileName, String market);
    void deleteTemplate(String templateName, String market);
}
