package com.web.app.service.impl;

import com.web.app.dto.MarketListResponse;
import com.web.app.dto.TemplateListResponse;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD12UploadDeletetemplatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD12UploadDeletetemplatServiceImpl implements UD12UploadDeletetemplatService {

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Value("${upload.template.path}")
    private String uploadBasePath;

    @Override
    public List<MarketListResponse> selectMarket() {
        return marketMasterMapper.selectAllMarket().stream()
            .map(m -> { MarketListResponse r = new MarketListResponse(); r.setMarket(m.getMarket()); return r; })
            .collect(Collectors.toList());
    }

    @Override
    public TemplateListResponse getTemplates() {
        TemplateListResponse response = new TemplateListResponse();
        List<TemplateListResponse.TemplateFileInfo> files = new ArrayList<>();

        // 扫描上传目录下的所有市场文件夹和文件
        Path basePath = Paths.get(uploadBasePath);
        if (Files.exists(basePath) && Files.isDirectory(basePath)) {
            try {
                java.io.File[] marketDirs = basePath.toFile().listFiles(java.io.File::isDirectory);
                if (marketDirs != null) {
                    for (java.io.File marketDir : marketDirs) {
                        String market = marketDir.getName();
                        java.io.File[] templateFiles = marketDir.listFiles(f -> f.isFile());
                        if (templateFiles != null) {
                            for (java.io.File tf : templateFiles) {
                                TemplateListResponse.TemplateFileInfo info = 
                                    new TemplateListResponse.TemplateFileInfo();
                                info.setFileName(tf.getName());
                                info.setMarket(market);
                                files.add(info);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // 目录扫描失败，返回空列表
            }
        }
        response.setTemplateFiles(files);
        return response;
    }

    @Override
    public void uploadTemplate(MultipartFile file, String fileName, String market) {
        // 目标路径: 网络共享目录/market/fileName
        Path marketDir = Paths.get(uploadBasePath, market);
        try {
            Files.createDirectories(marketDir);
            Path targetPath = marketDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public void deleteTemplate(String templateName, String market) {
        Path filePath = Paths.get(uploadBasePath, market, templateName);
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("文件删除失败: " + e.getMessage());
        }
    }
}
