package com.web.app.service.impl;

import com.web.app.dto.FileInfoResponse;
import com.web.app.dto.MarketListResponse;
import com.web.app.dto.UsedDataResponse;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD14ListAvailableTemplatesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD14ListAvailableTemplatesServiceImpl implements UD14ListAvailableTemplatesService {

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Value("${upload.template.path}")
    private String uploadBasePath;

    @Override
    public List<MarketListResponse> selectMarketMaster() {
        return marketMasterMapper.selectAllMarket().stream()
            .map(m -> { MarketListResponse r = new MarketListResponse(); r.setMarket(m.getMarket()); return r; })
            .collect(Collectors.toList());
    }

    @Override
    public List<FileInfoResponse> selectAllFiles() {
        List<FileInfoResponse> result = new ArrayList<>();
        Path basePath = Paths.get(uploadBasePath);
        if (!Files.exists(basePath) || !Files.isDirectory(basePath)) {
            return result;
        }
        File[] marketDirs = basePath.toFile().listFiles(File::isDirectory);
        if (marketDirs == null) return result;

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        for (File marketDir : marketDirs) {
            String market = marketDir.getName();
            File[] files = marketDir.listFiles(File::isFile);
            if (files != null) {
                for (File f : files) {
                    FileInfoResponse info = new FileInfoResponse();
                    info.setFileName(f.getName());
                    info.setMarket(market);
                    info.setLastMod(sdf.format(new Date(f.lastModified())));
                    info.setSize(formatFileSize(f.length()));
                    result.add(info);
                }
            }
        }
        return result;
    }

    @Override
    public List<UsedDataResponse> selectHdocUserDefinedUsed(String market) {
        List<com.web.app.entity.HdocUserDefinedRules> rules = 
            hdocUserDefinedRulesMapper.selectByMarket(market);
        return rules.stream()
            .map(r -> {
                UsedDataResponse d = new UsedDataResponse();
                d.setVariable(r.getVariable());
                d.setVal(r.getVal());
                return d;
            })
            .collect(Collectors.toList());
    }

    @Override
    public byte[] downloadFile(String market, String fileName) {
        if (market == null || fileName == null || market.isBlank() || fileName.isBlank()) {
            throw new RuntimeException("参数不能为空");
        }
        Path filePath = Paths.get(uploadBasePath, market, fileName);
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new RuntimeException("文件不存在");
        }
        try {
            return Files.readAllBytes(filePath);
        } catch (java.io.IOException e) {
            throw new RuntimeException("文件读取失败");
        }
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}
