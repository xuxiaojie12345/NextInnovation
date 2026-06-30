package com.web.app.controller;

import com.web.app.domain.*;
import com.web.app.service.UD12Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * UD12控制器 - UD12UploadDeletetemplatApi
 * 对应详细设计：详细设计/詳細設計UD12.md
 * 对应全体APIのプロンプト.txt 【UD12UploadDeletetemplatApi】
 *
 * 功能说明：
 * 1. UD12SelectMarket - 市场列表及模板文件查询
 *    (1) GET /api/ud12/selectmarket - 获取所有市场列表
 *    (2) GET /api/ud12/selectmarket/{marketCode} - 获取指定市场下的模板文件列表
 * 2. UD12UploadFlie - 文件上传（POST /api/ud12/upload, multipart/form-data）
 * 3. UD12DeleteFlie - 文件删除（POST /api/ud12/delete）
 */
@RestController
@RequestMapping("/api/ud12")
public class UD12Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD12Controller.class);

    @Autowired
    private UD12Service ud12Service;

    /**
     * UD12SelectMarket - 获取可用市场列表
     * 客户端通过GET请求访问接口 /api/ud12/selectmarket（无参数）
     * 对应详细设计 3.1.1 页面初始化流程, 4.1 场景1
     *
     * @return 市场列表（含marketCode和marketName）
     */
    @GetMapping("/selectmarket")
    public ApiResponse<List<UD12MarketResponse>> selectMarket() {
        logger.info("UD12SelectMarket called - get all markets");

        try {
            List<UD12MarketResponse> marketList = ud12Service.selectMarketMaster();
            return ApiResponse.success(marketList);
        } catch (Exception e) {
            logger.error("UD12SelectMarket error", e);
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }

    /**
     * UD12SelectMarket - 获取指定市场下的模板文件列表
     * 客户端通过GET请求访问接口 /api/ud12/selectmarket/{marketCode}
     * 对应详细设计 3.1.4 市场选择联动流程, 4.1 场景2
     *
     * @param marketCode 市场代码（路径参数）
     * @return 模板文件列表（含fileName和filePath）
     */
    @GetMapping("/selectmarket/{marketCode}")
    public ApiResponse<List<UD12TemplateFileResponse>> selectTemplateFiles(
            @PathVariable("marketCode") String marketCode) {

        logger.info("UD12SelectMarket called - get templates for market: {}", marketCode);

        if (marketCode == null || marketCode.trim().isEmpty()) {
            return ApiResponse.error(400, "Please select market and template.");
        }

        try {
            List<UD12TemplateFileResponse> fileList = ud12Service.selectTemplateFiles(marketCode.trim());
            return ApiResponse.success(fileList);
        } catch (Exception e) {
            logger.error("UD12SelectTemplateFiles error for market: " + marketCode, e);
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }

    /**
     * UD12UploadFlie - 上传模板文件到指定市场文件夹
     * 客户端通过POST请求访问接口 /api/ud12/upload
     * Content-Type: multipart/form-data
     * 参数：file（文件对象）, market（市场代码）
     * 对应详细设计 3.1.2 文件上传流程, 4.2
     *
     * @param file   上传的文件对象
     * @param market 市场代码
     * @return 上传结果（文件名和市场代码）
     */
    @PostMapping("/upload")
    public ApiResponse<UD12FileOperationResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("market") String market) {

        logger.info("UD12UploadFlie called - file: {}, market: {}", file.getOriginalFilename(), market);

        // 参数非空校验
        if (file.isEmpty()) {
            return ApiResponse.error(400, "NO FILE UPLOADED");
        }

        if (market == null || market.trim().isEmpty()) {
            return ApiResponse.error(400, "Please select market and template.");
        }

        // 验证文件大小（最大10MB）- 对应详细设计 3.2 No.2
        if (file.getSize() > 10 * 1024 * 1024) {
            return ApiResponse.error(400, "File size exceeds the 10MB limit.");
        }

        try {
            UD12FileOperationResponse result = ud12Service.uploadFile(file, market.trim());
            logger.info("UD12UploadFlie success - file: {}", result.getFileName());
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            logger.warn("UD12UploadFlie validation error: {}", e.getMessage());
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            logger.error("UD12UploadFlie error", e);
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }

    /**
     * UD12DeleteFlie - 从指定市场文件夹删除模板文件
     * 客户端通过POST请求访问接口 /api/ud12/delete
     * 请求体：{ "market": "JPN", "fileName": "template1.rtf" }
     * 对应详细设计 3.1.3 模板删除流程, 4.3
     *
     * @param request 删除请求（含market和fileName）
     * @return 删除结果（文件名和市场代码）
     */
    @PostMapping("/delete")
    public ApiResponse<UD12FileOperationResponse> deleteFile(@RequestBody UD12DeleteRequest request) {

        logger.info("UD12DeleteFlie called - market: {}, file: {}", request.getMarket(), request.getFileName());

        // 参数非空校验 - 对应详细设计 3.2 No.3
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()
                || request.getFileName() == null || request.getFileName().trim().isEmpty()) {
            return ApiResponse.error(400, "Please select market and template.");
        }

        try {
            UD12FileOperationResponse result = ud12Service.deleteFile(
                    request.getMarket().trim(), request.getFileName().trim());
            logger.info("UD12DeleteFlie success - file: {}", result.getFileName());
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            logger.warn("UD12DeleteFlie validation error: {}", e.getMessage());
            if (e.getMessage().contains("File not found")) {
                return ApiResponse.notFound(e.getMessage());
            }
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            logger.error("UD12DeleteFlie error", e);
            return ApiResponse.error(500, "System error. Please contact administrator.");
        }
    }
}
