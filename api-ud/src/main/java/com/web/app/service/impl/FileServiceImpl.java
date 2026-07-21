package com.web.app.service.impl;

import com.web.app.exception.BusinessException;
import com.web.app.service.FileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileServiceImpl implements FileService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public void uploadFile(MultipartFile file, String market) {
        if (file.isEmpty()) {
            throw new BusinessException(400, "File is empty");
        }
        try {
            Path marketDir = Paths.get(uploadDir, market);
            if (!Files.exists(marketDir)) {
                Files.createDirectories(marketDir);
            }
            Path targetPath = marketDir.resolve(file.getOriginalFilename());
            file.transferTo(targetPath.toFile());
        } catch (IOException e) {
            throw new BusinessException(500, "File upload failed: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String market, String fileName) {
        try {
            Path targetPath = Paths.get(uploadDir, market, fileName);
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            throw new BusinessException(500, "File deletion failed: " + e.getMessage());
        }
    }
}
