package com.web.app.service.impl;

import com.web.app.mapper.UD201Mapper;
import com.web.app.service.UD201Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * UD20-1业务逻辑实现类
 * 更新HDOC_DOCUMENT_LIST表数据
 */
@Service
public class UD201ServiceImpl implements UD201Service {

    private static final Logger logger = LoggerFactory.getLogger(UD201ServiceImpl.class);

    @Autowired
    private UD201Mapper ud201Mapper;

    @Override
    public String updateHdocDocumentList(String doctype, Map<String, String> request) {
        // 检查Document type是否存在
        Integer count = ud201Mapper.countByDoctype(doctype);
        if (count == null || count == 0) {
            logger.warn("UD20-1Update - Document type does not exists: {}", doctype);
            return "Document type does not exists. Please enter the correct content.";
        }

        String user = request.getOrDefault("user", "");
        String date = request.getOrDefault("date", "");
        String updateUser = request.getOrDefault("updateUser", "");
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        // 如果前端传了updateUser则使用，否则使用user字段
        String finalUpdateUser = updateUser.isEmpty() ? user : updateUser;

        ud201Mapper.updateHdocDocumentList(doctype, finalUpdateUser, now);
        logger.info("UD20-1Update success for doctype: {}", doctype);
        return null; // null表示成功
    }
}
