package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD12UploadDeletetemplatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class UD12UploadDeletetemplatController {

    @Autowired
    private UD12UploadDeletetemplatService ud12UploadDeletetemplatService;

    @PostMapping("/UD12UploadDeletetemplatApi/selectmarketmaster")
    public UD12MarketListResponse selectMarketMaster() {
        return ud12UploadDeletetemplatService.selectMarketMaster();
    }

    @PostMapping("/ud12uploaddeletetemplat/uploadfile")
    public UD12FileOperationResponse uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("market") String market) {
        return ud12UploadDeletetemplatService.uploadFile(file, market);
    }

    @PostMapping("/ud12uploaddeletetemplat/deletefile")
    public UD12FileOperationResponse deleteFile(@RequestBody UD12UploadDeletetemplatRequest request) {
        return ud12UploadDeletetemplatService.deleteFile(request);
    }
}
