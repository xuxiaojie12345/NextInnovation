package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.SelectListResponse;
import com.web.app.service.MasterDataService;
import com.web.app.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AvailableTemplatesController {

    @Autowired
    private MasterDataService masterDataService;
    @Autowired
    private FileService fileService;

    @GetMapping("/UD14SelectMarketmaster")
    public ApiResponse<List<SelectListResponse>> selectMarketMaster() {
        return ApiResponse.success(masterDataService.getMarketList());
    }

    @GetMapping("/UD14SelectHdocuserdefinedrules")
    public ApiResponse<List<String>> selectHdocUserDefinedRules() {
        return ApiResponse.success(masterDataService.getDistinctVariableList());
    }

    @GetMapping("/UD14downfile")
    public ResponseEntity<Resource> downloadFile(@RequestParam String market, @RequestParam String fileName) {
        try {
            Path filePath = Paths.get("./uploads", market, fileName);
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
