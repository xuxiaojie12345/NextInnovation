package com.web.app.service.impl;

import com.web.app.domain.UD12FileOperationResponse;
import com.web.app.domain.UD12MarketResponse;
import com.web.app.domain.UD12TemplateFileResponse;
import com.web.app.domain.entity.MarketMaster;
import com.web.app.mapper.UD12Mapper;
import com.web.app.service.UD12Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UD12UploadDeletetemplatApi 服务实现类
 * 对应全体APIのプロンプト.txt 【UD12UploadDeletetemplatApi】
 *
 * 功能：模板上传删除管理
 * - UD12SelectMarket: 市场列表及模板文件查询
 * - UD12UploadFlie: 文件上传
 * - UD12DeleteFlie: 文件删除
 */
@Service
public class UD12ServiceImpl implements UD12Service {

    private static final Logger logger = LoggerFactory.getLogger(UD12ServiceImpl.class);

    /** 模板文件存储根目录 */
    @Value("${ud12.template.root:/data/templates}")
    private String templateRoot;

    /** 允许上传的最大文件大小（10MB） */
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @Autowired
    private UD12Mapper ud12Mapper;

    /**
     * UD12SelectMarket - 从MARKET_MASTER表无条件检索所有市场信息
     * 对应全体APIのプロンプト.txt 4.1 场景1
     */
    @Override
    public List<UD12MarketResponse> selectMarketMaster() {
        List<MarketMaster> marketMasters = ud12Mapper.selectAllMarketMaster();

        // 将实体转换为前端期望的响应格式（marketCode / marketName）
        return marketMasters.stream()
                .map(m -> new UD12MarketResponse(
                        m.getMarket(),
                        m.getDescription() != null ? m.getDescription() : m.getMarket()))
                .collect(Collectors.toList());
    }

    /**
     * UD12SelectMarket - 根据市场代码读取对应文件夹下的文件列表
     * 对应全体APIのプロンプト.txt 4.1 场景2
     */
    @Override
    public List<UD12TemplateFileResponse> selectTemplateFiles(String marketCode) {
        List<UD12TemplateFileResponse> fileList = new ArrayList<>();

        // 构建市场对应的文件夹路径
        Path marketDir = Paths.get(templateRoot, marketCode);

        if (Files.exists(marketDir) && Files.isDirectory(marketDir)) {
            try {
                // 读取文件夹下的所有文件
                List<File> files = Files.list(marketDir)
                        .filter(Files::isRegularFile)
                        .map(Path::toFile)
                        .collect(Collectors.toList());

                for (File file : files) {
                    fileList.add(new UD12TemplateFileResponse(
                            file.getName(),
                            file.getAbsolutePath()));
                }
            } catch (IOException e) {
                logger.error("Failed to list template files for market: {}", marketCode, e);
            }
        } else {
            logger.warn("Template directory not found for market: {}", marketCode);
        }

        return fileList;
    }

    /**
     * UD12UploadFlie - 上传模板文件到指定市场文件夹
     * 对应全体APIのプロンプト.txt 4.6~4.10
     *
     * 处理流程：
     * 1. 验证文件类型和大小（最大10MB）
     * 2. 创建市场文件夹（如果不存在）
     * 3. 将文件保存到指定市场对应的文件夹
     */
    @Override
    public UD12FileOperationResponse uploadFile(MultipartFile file, String market) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // 验证文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the 10MB limit.");
        }

        // 构建市场文件夹路径
        Path marketDir = Paths.get(templateRoot, market);

        try {
            // 创建市场文件夹（如果不存在）
            Files.createDirectories(marketDir);

            // 构建目标文件路径
            String originalFileName = file.getOriginalFilename();
            Path targetPath = marketDir.resolve(originalFileName);

            // 保存文件
            file.transferTo(targetPath.toFile());

            logger.info("File uploaded successfully: {} -> {}", originalFileName, targetPath);

            return new UD12FileOperationResponse(originalFileName, market);

        } catch (IOException e) {
            logger.error("Failed to upload file to market: {}", market, e);
            throw new RuntimeException("Failed to upload file.", e);
        }
    }

    /**
     * UD12DeleteFlie - 从指定市场文件夹删除模板文件
     * 对应全体APIのプロンプト.txt 4.11~4.15
     *
     * 处理流程：
     * 1. 验证文件和路径存在性
     * 2. 从指定市场文件夹删除文件
     */
    @Override
    public UD12FileOperationResponse deleteFile(String market, String fileName) {
        // 构建文件路径
        Path filePath = Paths.get(templateRoot, market, fileName);

        File file = filePath.toFile();

        // 验证文件是否存在
        if (!file.exists()) {
            throw new IllegalArgumentException("File not found: " + fileName);
        }

        // 执行删除
        boolean deleted = file.delete();

        if (!deleted) {
            throw new RuntimeException("Failed to delete file: " + fileName);
        }

        logger.info("File deleted successfully: {}", filePath);

        return new UD12FileOperationResponse(fileName, market);
    }
}
