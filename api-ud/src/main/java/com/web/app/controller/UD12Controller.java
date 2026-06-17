package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD12Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * UD12 Controller
 * 提供市场列表获取、模板文件上传/删除/查询API接口
 */
@Slf4j
@RestController
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD12Controller {

    @Autowired
    private UD12Service ud12Service;

    /**
     * 获取市场列表
     * GET /api/ud12UploadDeletetemplat/getMarketList
     *
     * @return API响应，包含市场列表
     */
    @GetMapping("/api/ud12UploadDeletetemplat/getMarketList")
    public ResponseEntity<ApiResponse<?>> getMarketList() {
        log.info("========== UD12 Controller: Get Market List ==========");

        ApiResponse<?> response = ud12Service.getMarketList();

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD12 Controller: Get Market List completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 获取指定市场下的模板文件列表
     * GET /api/template/files/{marketCode}
     *
     * @param marketCode 市场代码
     * @return API响应，包含模板文件列表
     */
    @GetMapping("/api/template/files/{marketCode}")
    public ResponseEntity<ApiResponse<?>> getTemplateFiles(@PathVariable String marketCode) {
        log.info("========== UD12 Controller: Get Template Files for market: {} ==========", marketCode);

        ApiResponse<?> response = ud12Service.getTemplateFiles(marketCode);

        log.info("Response code: {}, msg: {}, data size: {}",
                response.getCode(), response.getMsg(),
                response.getData() instanceof java.util.List ?
                ((java.util.List<?>) response.getData()).size() : "N/A");
        log.info("========== UD12 Controller: Get Template Files completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 上传模板文件
     * POST /api/template/upload
     *
     * @param file   上传的文件
     * @param market 市场代码
     * @return API响应
     */
    @PostMapping(value = "/api/template/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("market") String market) {
        log.info("========== UD12 Controller: Upload File ==========");
        log.info("File original name: {}, size: {}, market: {}",
                file != null ? file.getOriginalFilename() : "null",
                file != null ? file.getSize() : 0,
                market);

        if (file == null || file.isEmpty()) {
            log.warn("File is null or empty in controller!");
        }

        ApiResponse<?> response = ud12Service.uploadFile(file, market);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD12 Controller: Upload completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除模板文件
     * POST /api/template/delete
     *
     * @param request 请求体（包含 market 和 fileName）
     * @return API响应
     */
    @PostMapping("/api/template/delete")
    public ResponseEntity<ApiResponse<?>> deleteFile(@RequestBody Map<String, String> request) {
        String market = request.get("market");
        String fileName = request.get("fileName");

        log.info("========== UD12 Controller: Delete File ==========");
        log.info("Market: {}, fileName: {}", market, fileName);

        ApiResponse<?> response = ud12Service.deleteFile(market, fileName);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD12 Controller: Delete completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 下载模板文件
     * GET /api/template/download/{market}/{fileName}
     *
     * @param market   市场代码
     * @param fileName 文件名
     * @return 文件流
     */
    @GetMapping("/api/template/download/{market}/{fileName}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String market,
            @PathVariable String fileName) {
        log.info("========== UD12 Controller: Download File ==========");
        log.info("Market: {}, fileName: {}", market, fileName);

        try {
            // 获取文件路径
            String uploadDir = ud12Service.getUploadDir();
            File file = new File(new File(uploadDir, market), fileName);

            log.info("File path: {}", file.getAbsolutePath());

            if (!file.exists() || !file.isFile()) {
                log.warn("File not found: {}", file.getAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);

            // 对文件名进行URL编码，确保中文文件名正常
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename*=UTF-8''" + encodedFileName)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error downloading file", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
