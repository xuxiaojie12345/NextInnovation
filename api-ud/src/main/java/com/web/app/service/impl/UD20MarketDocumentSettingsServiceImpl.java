package com.web.app.service.impl;

import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD20MarketDocumentSettingsService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * UD20_MarketDocumentSettings 服务实现类
 */
@Service
public class UD20MarketDocumentSettingsServiceImpl implements UD20MarketDocumentSettingsService {

    private static final Logger logger = LogManager.getLogger(UD20MarketDocumentSettingsServiceImpl.class);

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public Map<String, Object> updateDocument(Map<String, Object> params) {
        String documentType = (String) params.get("documentType");
        String businessUnit = (String) params.get("businessUnit");
        String user = (String) params.get("user");
        String date = (String) params.get("date");
        if (date == null || date.trim().isEmpty()) {
            date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }

        logger.info("更新文档信息，documentType: {}", documentType);

        // 检查文档是否存在
        if (hdocDocumentListMapper.countByDoctype(documentType) == 0) {
            throw new RuntimeException("No data found");
        }

        // 更新文档
        hdocDocumentListMapper.updateDocument(documentType, user, date);

        // 组装返回结果
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("documentType", documentType);
        result.put("businessUnit", businessUnit);
        result.put("user", user);
        result.put("date", date);

        return result;
    }
}
