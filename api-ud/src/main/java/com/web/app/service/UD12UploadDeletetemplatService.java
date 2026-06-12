package com.web.app.service;

import com.web.app.dto.*;
import org.springframework.web.multipart.MultipartFile;

public interface UD12UploadDeletetemplatService {
    UD12MarketListResponse selectMarketMaster();
    UD12FileOperationResponse uploadFile(MultipartFile file, String market);
    UD12FileOperationResponse deleteFile(UD12UploadDeletetemplatRequest request);
}
