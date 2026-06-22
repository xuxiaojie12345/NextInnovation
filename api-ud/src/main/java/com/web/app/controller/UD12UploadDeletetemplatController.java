package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD12UploadDeletetemplatService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * UD12_UploadDeletetemplat 控制器
 * 提供文件的上传、下载、删除以及市场列表查询功能
 */
@RestController
@RequestMapping("/api/ud12uploaddeletetemplat")
@Api(tags = "UD12-文件上传删除管理")
public class UD12UploadDeletetemplatController {

    private static final Logger logger = LogManager.getLogger(UD12UploadDeletetemplatController.class);

    @Autowired
    private UD12UploadDeletetemplatService ud12UploadDeletetemplatService;

    /**
     * 获取市场列表
     *
     * @return 统一响应对象
     */
    @GetMapping("/selectmarketmaster")
    @ApiOperation(value = "获取市场列表", notes = "查询MARKET_MASTER表获取市场列表")
    public ApiResponse<List<Map<String, Object>>> selectMarketMaster() {
        logger.info("接收到获取市场列表请求");

        try {
            List<Map<String, Object>> markets = ud12UploadDeletetemplatService.selectMarketMaster();
            return ApiResponse.success("查询成功", markets);
        } catch (Exception e) {
            logger.error("获取市场列表失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 上传文件
     *
     * @param market 目标市场
     * @param file   上传的文件
     * @return 统一响应对象
     */
    @PostMapping("/uploadfile")
    @ApiOperation(value = "上传文件", notes = "将文件上传到指定市场的模板目录中")
    public ApiResponse<Void> uploadFile(
            @RequestParam("market") String market,
            @RequestParam("file") MultipartFile file) {

        logger.info("接收到文件上传请求，market: {}, fileName: {}", market, file.getOriginalFilename());

        try {
            if (file.isEmpty()) {
                return ApiResponse.error("NO FILE UPLOADED");
            }
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error("请选择目标市场");
            }

            ud12UploadDeletetemplatService.uploadFile(market, file.getOriginalFilename(), file.getBytes());

            String msg = "TEMPLATE [" + file.getOriginalFilename() + "] WAS SUCCESSFULLY UPLOADED TO MARKET [" + market + "]";
            logger.info(msg);
            return ApiResponse.success(msg);
        } catch (Exception e) {
            logger.error("文件上传失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除文件
     *
     * @param params 请求参数（包含market, template）
     * @return 统一响应对象
     */
    @PostMapping("/deletefile")
    @ApiOperation(value = "删除文件", notes = "从指定市场的模板目录中删除文件")
    public ApiResponse<Void> deleteFile(@RequestBody Map<String, String> params) {

        logger.info("接收到文件删除请求");

        try {
            String market = params.get("market");
            String template = params.get("template");

            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error("Market is required");
            }
            if (template == null || template.trim().isEmpty()) {
                return ApiResponse.error("Template file name is required");
            }

            ud12UploadDeletetemplatService.deleteFile(market, template);

            String msg = "TEMPLATE [" + template + "] WAS SUCCESSFULLY DELETED FROM MARKET [" + market + "]";
            logger.info(msg);
            return ApiResponse.success(msg);
        } catch (Exception e) {
            logger.error("文件删除失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
