package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.mapper.UD14Mapper;
import com.web.app.service.UD14Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

/**
 * UD14 Service Implementation
 * 实现市场列表获取、根据市场获取模板文件及使用变量业务逻辑
 */
@Service
public class UD14ServiceImpl implements UD14Service {

    @Autowired
    private UD14Mapper ud14Mapper;

    /**
     * 模板文件存储根目录
     */
    @Value("${template.upload.dir:/data/templates}")
    private String uploadDir;

    @Override
    public ApiResponse<?> getMarkets() {

        try {
            List<MarketMaster> marketList = ud14Mapper.selectMarketMaster();
            List<Map<String, String>> dataList = marketList.stream().map(m -> {
                Map<String, String> item = new HashMap<>();
                item.put("market", m.getMarket());
                return item;
            }).collect(Collectors.toList());

            return ApiResponse.success("获取市场列表成功", dataList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> getVariablesByMarket(String market) {

        try {
            // 验证参数
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error(400, "市场代码不能为空");
            }

            String marketTrimmed = market.trim();

            // 读取该市场文件夹下的所有模板文件
            File baseDir = new File(uploadDir);
            File marketDir = new File(baseDir, marketTrimmed);

            List<Map<String, Object>> fileList = new ArrayList<>();

            if (marketDir.exists() && marketDir.isDirectory()) {
                File[] files = marketDir.listFiles(File::isFile);
                if (files != null) {
                    for (File f : files) {
                        String filename = f.getName();

                        // 查询该文件被哪些变量使用
                        // VAL的格式为 market/filename
                        String valValue = marketTrimmed + "/" + filename;
                        List<String> variables = ud14Mapper.selectVariablesByVal(marketTrimmed, valValue);

                        // 多个变量用空格分隔
                        String used = variables != null && !variables.isEmpty()
                                ? String.join(" ", variables)
                                : "";

                        Map<String, Object> fileInfo = new HashMap<>();
                        fileInfo.put("filename", filename);
                        fileInfo.put("used", used);
                        fileInfo.put("lastMod", new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(new Date(f.lastModified())));
                        fileInfo.put("size", formatFileSize(f.length()));

                        fileList.add(fileInfo);
                    }
                }
            }

            return ApiResponse.success("根据市场获取变量列表成功", fileList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 格式化文件大小
     */
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}
