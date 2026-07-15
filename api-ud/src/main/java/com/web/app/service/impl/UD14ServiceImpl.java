package com.web.app.service.impl;

import com.web.app.mapper.UD14Mapper;
import com.web.app.service.UD14Service;
import com.web.app.tool.NetworkShareUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

/**
 * UD14SearchresultistApi 服务实现类
 * 对应全体APIのプロンプト.txt 【UD14SearchresultistApi】
 *
 * 功能：模板文件列表与使用状态查询
 * 从网络共享文件夹 //172.17.0.63/hdoc/template/upload 读取文件列表
 */
@SuppressWarnings("null")
@Service
public class UD14ServiceImpl implements UD14Service {

    private static final Logger logger = LoggerFactory.getLogger(UD14ServiceImpl.class);

    /** 模板文件存储根目录 - 网络共享文件夹 */
    @Value("${ud12.template.root:d://uploads/templates}")
    private String templateRoot;

    /** 网络共享文件夹用户名 */
    @Value("${ud12.network.username:}")
    private String networkUsername;

    /** 网络共享文件夹密码 */
    @Value("${ud12.network.password:}")
    private String networkPassword;

    @Autowired
    private UD14Mapper ud14Mapper;

    /**
     * 初始化时认证网络共享文件夹
     */
    @PostConstruct
    public void init() {
        NetworkShareUtil.authenticate(templateRoot, networkUsername, networkPassword);
    }

    @Override
    public Map<String, Object> selectMarketMaster() {
        List<Map<String, String>> markets = ud14Mapper.selectAllMarketMaster().stream()
                .map(m -> {
                    Map<String, String> map = new LinkedHashMap<>();
                    map.put("market", m.getMarket());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("markets", markets);
        result.put("totalCount", markets.size());
        return result;
    }

    @Override
    public Map<String, Object> selectHdocUserDefinedRules(String market) {
        List<Map<String, Object>> fileList = new ArrayList<>();

        // 从网络共享文件夹读取实际文件列表（与UD12相同的路径）
        Path marketDir = Paths.get(templateRoot, market);

        if (Files.exists(marketDir) && Files.isDirectory(marketDir)) {
            try {
                List<File> files = Files.list(marketDir)
                        .filter(Files::isRegularFile)
                        .map(Path::toFile)
                        .sorted(Comparator.comparing(File::getName))
                        .collect(Collectors.toList());

                for (File file : files) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("filename", file.getName());
                    item.put("lastModified", new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm")
                            .format(new Date(file.lastModified())));
                    item.put("size", formatFileSize(file.length()));

                    // 查询该文件是否被引用
                    int refCount = ud14Mapper.countByMarketAndFileName(market, market + "/" + file.getName());
                    item.put("used", refCount > 0 ? "TEMPLATE-VIN-PLATE" : "");

                    // 下载URL
                    item.put("downloadUrl", "/download/templates/" + market + "/" + file.getName());

                    fileList.add(item);
                }

                logger.info("UD14 - Found {} files in market {}", fileList.size(), market);
            } catch (IOException e) {
                logger.error("UD14 - Failed to list files for market: {}", market, e);
            }
        } else {
            logger.warn("UD14 - Template directory not found for market: {}", market);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("files", fileList);
        result.put("totalCount", fileList.size());
        return result;
    }

    /**
     * 格式化文件大小
     */
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }

    @Override
    public org.springframework.core.io.Resource loadFileAsResource(String market, String filename) {
        try {
            Path filePath = Paths.get(templateRoot, market, filename);
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + filePath);
            }
        } catch (Exception e) {
            logger.error("UD14 - Failed to load file: market={}, filename={}", market, filename, e);
            throw new RuntimeException("Failed to load file: " + filename, e);
        }
    }
}
