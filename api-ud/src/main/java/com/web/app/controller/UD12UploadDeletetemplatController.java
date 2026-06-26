package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD12UploadDeletetemplatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD12UploadDeletetemplatController {

    @Autowired
    private UD12UploadDeletetemplatService uploadDeletetemplatService;

    @PostMapping("/ud12/selectmarket")
    public ResponseEntity<ApiResponse<List<MarketListResponse>>> selectMarket() {
        List<MarketListResponse> list = uploadDeletetemplatService.selectMarket();
        return ResponseEntity.ok(ApiResponse.success("情报获取成功", list));
    }

    @PostMapping("/ud12/gettemplates")
    public ResponseEntity<ApiResponse<TemplateListResponse>> getTemplates() {
        TemplateListResponse list = uploadDeletetemplatService.getTemplates();
        return ResponseEntity.ok(ApiResponse.success("文档获取成功", list));
    }

    @PostMapping("/ud12/uploadtemplate")
    public ResponseEntity<ApiResponse<Void>> uploadTemplate(
        @RequestParam("templateFile") MultipartFile file,
        @RequestParam("market") String market
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "上传文件不能为空"));
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "文件名不能为空"));
        }
        uploadDeletetemplatService.uploadTemplate(file, originalFilename, market);
        return ResponseEntity.ok(ApiResponse.success("文档上传成功", null));
    }

    @PostMapping("/ud12/deletetemplate")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@RequestBody TemplateRequest request) {
        uploadDeletetemplatService.deleteTemplate(request.getTemplateName(), request.getMarket());
        return ResponseEntity.ok(ApiResponse.success("文档删除成功", null));
    }
}
