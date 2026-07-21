package com.web.app.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileService {
    void uploadFile(MultipartFile file, String market);
    void deleteFile(String market, String fileName);
}
