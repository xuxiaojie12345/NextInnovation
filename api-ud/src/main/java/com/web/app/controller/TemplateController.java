package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.SelectListResponse;
import com.web.app.dto.request.UD12DeleteFileRequest;
import com.web.app.service.FileService;
import com.web.app.service.MasterDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    /** 模板文件下载：返回一个空白的 .trf 模板文件（供 Modify Document 画面下载） */
    @GetMapping("/download/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        String content = "// TEMPLATE VIN_PLATE (blank)\r\n";
        byte[] data = content.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=template.trf")
                .contentType(MediaType.parseMediaType("application/octet-stream"))
                .body(data);
    }

    @PostMapping("/UD12UploadFile")
    public ApiResponse<Void> uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("market") String market) {
        fileService.uploadFile(file, market);
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        return ApiResponse.success(null, "TEMPLATE " + filename + " WAS SUCCESSFULLY UPLOADED TO MARKET " + market);
    }

    @PostMapping("/UD12DeleteFile")
    public ApiResponse<Void> deleteFile(@RequestBody UD12DeleteFileRequest request) {
        fileService.deleteFile(request.getMarket(), request.getFileName());
        return ApiResponse.success(null, "TEMPLATE " + request.getFileName() + " WAS SUCCESSFULLY DELETE FROM MARKET " + request.getMarket());
    }

    @GetMapping("/UD12GetTemplatesByMarket")
    public ApiResponse<List<String>> getTemplatesByMarket(@RequestParam("market") String market) {
        return ApiResponse.success(fileService.getTemplatesByMarket(market));
    }
}
