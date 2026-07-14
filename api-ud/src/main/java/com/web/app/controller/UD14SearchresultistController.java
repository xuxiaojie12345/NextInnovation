package com.web.app.controller;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.service.UD14SearchresultistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * UD14 搜索结果列表控制器
 *
 * 功能说明：提供市场列表、文件列表查询和文件下载接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud14")
@Api(tags = "UD14 - 搜索结果列表")
public class UD14SearchresultistController {

    @Autowired
    private UD14SearchresultistService ud14Service;

    @Value("${file.marketFolder}")
    private String marketFolder;

    @Value("${file.fileServerUsername}")
    private String fileServerUsername;

    @Value("${file.fileServerPassword}")
    private String fileServerPassword;

    /** 认证是否已成功的标记 */
    private boolean authenticated = false;

    /**
     * 认证文件服务器共享路径（懒加载，首次操作时调用）
     */
    private synchronized void authenticateIfNeeded() {
        if (authenticated)
            return;
        try {
            String normalized = marketFolder.replace('\\', '/');
            String[] parts = normalized.split("/");
            String serverShare = "\\\\" + parts[2] + "\\" + parts[3];

            new ProcessBuilder("cmd.exe", "/c", "net use " + serverShare + " /delete /y")
                    .start().waitFor();

            Process process = new ProcessBuilder("cmd.exe", "/c",
                    "net use " + serverShare + " " + fileServerPassword + " /user:" + fileServerUsername)
                    .start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                authenticated = true;
                log.info("UD14文件服务器认证成功: {}", serverShare);
            } else {
                String errorMsg = new String(process.getErrorStream().readAllBytes());
                log.warn("UD14文件服务器认证结果: exitCode={}, msg={}", exitCode, errorMsg);
            }
        } catch (Exception e) {
            log.error("UD14文件服务器认证失败", e);
        }
    }

    @GetMapping("/market")
    @ApiOperation(value = "获取市场列表", notes = "查询所有市场MARKET列表")
    public UD14SearchresultistResponse getMarket() {
        log.info("收到UD14查询市场列表请求");
        return ud14Service.selectMarketMaster();
    }

    @GetMapping("/user-defined-rules")
    @ApiOperation(value = "获取用户定义规则变量列表", notes = "根据市场查询HDOC_USER_DEFINED_RULES表中的变量列表")
    public UD14SearchresultistResponse getUserDefinedRules(
            @ApiParam(value = "市场", required = true, example = "JP") @RequestParam("market") String market) {
        log.info("收到UD14查询用户定义规则变量请求, market: {}", market);
        UD14SearchresultistRequest request = new UD14SearchresultistRequest();
        request.setMarket(market);
        return ud14Service.selectUserDefinedRules(request);
    }

    /**
     * 获取指定Market文件夹下的文件列表
     * 对应设计书 3.1.2 Market选择与文件列表显示流程
     *
     * Method: GET
     * Endpoint: /api/ud14/files
     * 参数: market
     */
    @GetMapping("/files")
    @ApiOperation(value = "获取市场文件列表", notes = "根据市场查询该Market文件夹下的所有文件信息")
    public UD14SearchresultistResponse getMarketFiles(
            @ApiParam(value = "市场", required = true, example = "AF") @RequestParam("market") String market) {
        log.info("收到UD14查询市场文件列表请求, market: {}", market);
        UD14SearchresultistRequest request = new UD14SearchresultistRequest();
        request.setMarket(market);
        return ud14Service.getMarketFiles(request);
    }

    /**
     * 下载指定的模板文件
     * 对应设计书 3.1.3 文件下载处理流程
     *
     * Method: GET
     * Endpoint: /api/ud14/downfile
     * 参数: market, filename
     */
    @GetMapping("/downfile")
    @ApiOperation(value = "下载模板文件", notes = "根据市场和文件名下载对应的模板文件")
    public ResponseEntity<?> downloadFile(
            @ApiParam(value = "市场", required = true, example = "AF") @RequestParam("market") String market,
            @ApiParam(value = "文件名", required = true, example = "af_file.rtf") @RequestParam("filename") String filename) {
        log.info("收到UD14下载文件请求, market: {}, filename: {}", market, filename);
        authenticateIfNeeded();

        try {
            // 验证文件名合法性（防止路径遍历攻击）
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.badRequest()
                        .body(UD14SearchresultistResponse.error(400, "文件名不合法"));
            }

            // 构建文件路径
            String filePath = marketFolder + File.separator + market + File.separator + filename;
            File file = new File(filePath);

            // 检查文件是否存在
            if (!file.exists() || !file.isFile()) {
                log.warn("UD14下载文件不存在: {}", filePath);
                return ResponseEntity.status(404)
                        .body(UD14SearchresultistResponse.error(404, "文件不存在"));
            }

            // 构建文件资源
            Resource resource = new FileSystemResource(file);
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + encodedFilename + "\"")
                    .body(resource);
        } catch (Exception e) {
            log.error("UD14文件下载失败", e);
            return ResponseEntity.status(500)
                    .body(UD14SearchresultistResponse.error(500, "文件下载失败"));
        }
    }
}
