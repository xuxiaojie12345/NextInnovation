package com.web.app.service.impl;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD14SearchresultistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * UD14 - 搜索结果列表服务实现类
 */
@Service
public class UD14SearchresultistServiceImpl implements UD14SearchresultistService {

    @Value("${hdoc.template.upload-path:\\\\172.17.0.63\\hdoc\\template\\upload}")
    private String uploadPath;

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public UD14SearchresultistResponse selectMarketmaster() {
        List<MarketMaster> markets = marketMasterMapper.selectAll();

        Map<String, Object> data = new HashMap<>();
        data.put("markets", markets);

        UD14SearchresultistResponse response = new UD14SearchresultistResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD14SearchresultistResponse selectHdocuserdefinedrules(UD14SearchresultistRequest request) {
        UD14SearchresultistResponse response = new UD14SearchresultistResponse();

        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("市场不能为空");
            return response;
        }

        List<String> variables = hdocUserDefinedRulesMapper.selectVariablesByMarket(request.getMarket());

        Map<String, Object> data = new HashMap<>();
        data.put("rules", variables);

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD14SearchresultistResponse selectTemplateFiles(UD14SearchresultistRequest request) {
        UD14SearchresultistResponse response = new UD14SearchresultistResponse();

        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("市场不能为空");
            return response;
        }

        try {
            String marketDir = uploadPath + File.separator + request.getMarket().trim();
            File dir = new File(marketDir);

            // 获取该市场已使用的变量列表
            List<String> usedVariables = hdocUserDefinedRulesMapper.selectVariablesByMarket(request.getMarket().trim());
            boolean marketHasRules = usedVariables != null && !usedVariables.isEmpty();

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
            List<Map<String, Object>> fileList = new ArrayList<>();

            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile()) {
                            Map<String, Object> item = new HashMap<>();
                            String fileName = f.getName();
                            item.put("filename", fileName);

                            // Used: 该市场下有规则记录则视为已使用
                            item.put("used", marketHasRules);

                            item.put("lastModified", sdf.format(new Date(f.lastModified())));
                            item.put("size", formatFileSize(f.length()));
                            fileList.add(item);
                        }
                    }
                }
            }

            // 按文件名排序
            fileList.sort((a, b) -> String.valueOf(a.get("filename")).compareToIgnoreCase(String.valueOf(b.get("filename"))));

            response.setCode(200);
            response.setMsg("查询成功");
            response.setData(fileList);
        } catch (Exception e) {
            response.setCode(500);
            response.setMsg("无法加载文件列表: " + e.getMessage());
        }

        return response;
    }

    @Override
    public Resource downloadFile(String market, String filename) {
        String filePath = uploadPath + File.separator + market + File.separator + filename;
        File file = new File(filePath);
        if (file.exists() && file.isFile()) {
            return new FileSystemResource(file);
        }
        return null;
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.0f Kb", bytes / 1024.0);
        return String.format("%.1f Mb", bytes / (1024.0 * 1024.0));
    }
}
