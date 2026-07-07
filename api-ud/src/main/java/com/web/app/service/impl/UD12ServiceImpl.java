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

import javax.annotation.PostConstruct;
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
 * 对应详细设计：詳細設計UD12.md
 *
 * 功能：模板上传删除管理
 * - UD12SelectMarket: 市场列表及模板文件查询（从MARKET_MASTER表获取市场列表）
 * - UD12UploadFlie: 文件上传到网络共享文件夹 //172.17.0.63/hdoc/template/upload
 * - UD12DeleteFlie: 从网络共享文件夹删除模板文件
 */
@Service
public class UD12ServiceImpl implements UD12Service {

    private static final Logger logger = LoggerFactory.getLogger(UD12ServiceImpl.class);

    /** 模板文件存储根目录 - 网络共享文件夹 */
    @Value("${ud12.template.root:d://uploads/templates}")
    private String templateRoot;

    /** 网络共享文件夹用户名 */
    @Value("${ud12.network.username:}")
    private String networkUsername;

    /** 网络共享文件夹密码 */
    @Value("${ud12.network.password:}")
    private String networkPassword;

    /** 允许上传的最大文件大小（10MB） */
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;



    /** 网络共享连接是否已验证 */
    private boolean networkAuthenticated = false;

    @Autowired
    private UD12Mapper ud12Mapper;

    /**
     * 初始化时认证网络共享文件夹
     */
    @PostConstruct
    public void init() {
        authenticateNetworkShare();
    }

    /**
     * 认证网络共享文件夹
     * 使用 net use 命令建立到网络共享的持久连接
     */
    private void authenticateNetworkShare() {
        if (networkAuthenticated) {
            return;
        }

        // 判断是否为UNC路径（以\\开头）
        if (templateRoot != null && templateRoot.startsWith("\\\\")) {
            // 检查是否有用户名密码配置
            if (networkUsername == null || networkUsername.isEmpty()) {
                logger.warn("Network username not configured, trying direct access to: {}",
                        templateRoot);
                networkAuthenticated = true;
                return;
            }
            try {
                // 提取服务器共享根路径（例如 \\172.17.0.63\hdoc）
                String shareRoot = templateRoot;
                int firstSlashAfterServer = templateRoot.indexOf('\\', 2);
                if (firstSlashAfterServer > 0) {
                    int secondSlashAfterServer = templateRoot.indexOf('\\', firstSlashAfterServer + 1);
                    if (secondSlashAfterServer > 0) {
                        shareRoot = templateRoot.substring(0, secondSlashAfterServer);
                    }
                }

                // 构建net use命令
                String command = String.format("net use %s %s /user:%s /persistent:no",
                        shareRoot, networkPassword, networkUsername);

                logger.info("Authenticating network share: {}", shareRoot);

                Process process = Runtime.getRuntime().exec(command);

                // 等待net use完成，最多5秒超时
                boolean completed = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);

                if (completed) {
                    int exitCode = process.exitValue();
                    if (exitCode == 0) {
                        networkAuthenticated = true;
                        logger.info("Network share authenticated successfully: {}", shareRoot);
                    } else {
                        String errorOutput = new String(process.getErrorStream().readAllBytes());
                        logger.warn("Network share authentication returned code {}: {}",
                                exitCode, errorOutput.trim());
                        networkAuthenticated = true;
                    }
                } else {
                    // 超时，销毁进程
                    process.destroyForcibly();
                    logger.warn("Network share authentication timed out, will try direct access");
                    networkAuthenticated = true;
                }
            } catch (Exception e) {
                logger.warn("Failed to authenticate network share, will try direct access: {}",
                        e.getMessage());
                // 不阻断执行，可能已有连接
                networkAuthenticated = true;
            }
        } else {
            // 非UNC路径（如本地路径），无需认证
            networkAuthenticated = true;
        }
    }

    /**
     * 获取市场根目录Path对象（确保已认证）
     */
    private Path getTemplateRootPath() {
        if (!networkAuthenticated) {
            authenticateNetworkShare();
        }
        return Paths.get(templateRoot);
    }

    /**
     * UD12SelectMarket - 从MARKET_MASTER表无条件检索所有市场信息
     * 对应详细设计 4.1 场景1
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
     * 对应详细设计 3.1.4 市场选择联动流程, 4.1 场景2
     *
     * 从网络共享文件夹读取指定市场目录下的所有模板文件
     */
    @Override
    public List<UD12TemplateFileResponse> selectTemplateFiles(String marketCode) {
        List<UD12TemplateFileResponse> fileList = new ArrayList<>();
        Path rootPath = getTemplateRootPath();

        // 构建市场对应的文件夹路径
        Path marketDir = rootPath.resolve(marketCode);

        if (Files.exists(marketDir) && Files.isDirectory(marketDir)) {
            try {
                // 读取文件夹下的所有文件
                List<File> files = Files.list(marketDir)
                        .filter(Files::isRegularFile)
                        .map(Path::toFile)
                        .collect(Collectors.toList());

                for (File file : files) {
                    // filePath使用相对路径格式：{marketCode}/{fileName}
                    String relativePath = marketCode + "/" + file.getName();
                    fileList.add(new UD12TemplateFileResponse(
                            file.getName(),
                            relativePath));
                }

                logger.info("Found {} template files in market {}", fileList.size(), marketCode);
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
     * 对应详细设计 3.1.2 文件上传流程, 4.2
     *
     * 处理流程：
     * 1. 验证文件大小（最大10MB）
     * 2. 创建市场文件夹（如果不存在）
     * 3. 将文件保存到网络共享文件夹下的指定市场目录
     */
    @Override
    public UD12FileOperationResponse uploadFile(MultipartFile file, String market) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("NO FILE UPLOADED");
        }

        // 验证文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the 10MB limit.");
        }

        Path rootPath = getTemplateRootPath();
        // 构建市场文件夹路径
        Path marketDir = rootPath.resolve(market);

        try {
            // 创建市场文件夹（如果不存在）
            Files.createDirectories(marketDir);

            // 获取原始文件名
            String originalFileName = file.getOriginalFilename();

            // 构建目标文件路径
            Path targetPath = marketDir.resolve(originalFileName);

            // 保存文件
            file.transferTo(targetPath.toFile());

            logger.info("File uploaded successfully: {} -> market: {}",
                    originalFileName, market);

            return new UD12FileOperationResponse(originalFileName, market);

        } catch (IOException e) {
            logger.error("Failed to upload file to market: {}", market, e);
            throw new RuntimeException("System error. Please contact administrator.", e);
        }
    }

    /**
     * UD12DeleteFlie - 从指定市场文件夹删除模板文件
     * 对应详细设计 3.1.3 模板删除流程, 4.3
     *
     * 处理流程：
     * 1. 验证文件和路径存在性
     * 2. 从网络共享文件夹下指定市场目录删除文件
     */
    @Override
    public UD12FileOperationResponse deleteFile(String market, String fileName) {
        Path rootPath = getTemplateRootPath();
        // 构建文件路径
        Path filePath = rootPath.resolve(market).resolve(fileName);

        File file = filePath.toFile();

        // 验证文件是否存在
        if (!file.exists()) {
            logger.warn("File not found for deletion: {}", filePath);
            throw new IllegalArgumentException("File not found");
        }

        // 执行删除
        boolean deleted = file.delete();

        if (!deleted) {
            logger.error("Failed to delete file: {}", filePath);
            throw new RuntimeException("System error. Please contact administrator.");
        }

        logger.info("File deleted successfully: {} from market {}", fileName, market);

        return new UD12FileOperationResponse(fileName, market);
    }
}
