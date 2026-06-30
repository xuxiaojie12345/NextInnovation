package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD14ListAvailableTemplatesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD14ListAvailableTemplatesController {

    @Autowired
    private UD14ListAvailableTemplatesService listAvailableTemplatesService;

    @PostMapping("/ud14/selectmarketmaster")
    public ResponseEntity<ApiResponse<InitPageResponse>> selectMarketMaster() {
        InitPageResponse response = new InitPageResponse();
        response.setMarketList(listAvailableTemplatesService.selectMarketMaster());
        response.setAllFiles(listAvailableTemplatesService.selectAllFiles());
        return ResponseEntity.ok(ApiResponse.success("数据获取成功", response));
    }

    @PostMapping("/ud14/selecthdocuserdefinedused")
    public ResponseEntity<ApiResponse<List<UsedDataResponse>>> selectHdocUserDefinedUsed(
        @RequestBody FileRequest request) {
        List<UsedDataResponse> list = listAvailableTemplatesService.selectHdocUserDefinedUsed(request.getMarket());
        return ResponseEntity.ok(ApiResponse.success("数据获取成功", list));
    }

    @PostMapping("/ud14/downfile")
    public ResponseEntity<?> downFile(@RequestBody FileRequest request) {
        try {
            byte[] fileData = listAvailableTemplatesService.downloadFile(request.getMarket(), request.getFileName());
            String contentType = "application/octet-stream";
            String headerValue = "attachment; filename=\"" + request.getFileName() + "\"";
            return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, headerValue)
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .body(fileData);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "文件下载失败"));
        }
    }
}
