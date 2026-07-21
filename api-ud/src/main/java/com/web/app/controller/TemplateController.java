package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.SelectListResponse;
import com.web.app.dto.request.UD12DeleteFileRequest;
import com.web.app.service.FileService;
import com.web.app.service.MasterDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api")
public class TemplateController {

    @Autowired
    private FileService fileService;
    @Autowired
    private MasterDataService masterDataService;

    @GetMapping("/UD12SelectMarket")
    public ApiResponse<List<SelectListResponse>> selectMarket() {
        return ApiResponse.success(masterDataService.getMarketList());
    }

    @PostMapping("/UD12UploadFile")
    public ApiResponse<Void> uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("market") String market) {
        fileService.uploadFile(file, market);
        return ApiResponse.success(null, "File uploaded successfully");
    }

    @PostMapping("/UD12DeleteFile")
    public ApiResponse<Void> deleteFile(@RequestBody UD12DeleteFileRequest request) {
        fileService.deleteFile(request.getMarket(), request.getFileName());
        return ApiResponse.success(null, "File deleted successfully");
    }
}
