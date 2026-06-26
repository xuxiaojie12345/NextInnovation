package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD20Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD20 Service Implementation
 * 实现获取文档类型列表的业务逻辑
 */
@Slf4j
@Service
public class UD20ServiceImpl implements UD20Service {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public ApiResponse<?> getDocumentList() {
        log.info("========== UD20 Service: Get Document List ==========");

        try {
            List<Map<String, Object>> documentList = hdocDocumentListMapper.selectDocumentTypeList();

            if (documentList == null || documentList.isEmpty()) {
                log.warn("Document list is empty");
                return ApiResponse.error(404, "文档列表为空");
            }

            log.info("Document list size: {}", documentList.size());

            return ApiResponse.success("获取文档列表成功", documentList);

        } catch (Exception e) {
            log.error("Error getting document list", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> searchDocumentList(String documentType, String operator) {
        log.info("========== UD20 Service: Search Document List ==========");
        log.info("documentType: {}, operator: {}", documentType, operator);

        try {
            List<Map<String, Object>> documentList = hdocDocumentListMapper.searchDocumentTypeList(documentType, operator);

            if (documentList == null || documentList.isEmpty()) {
                log.warn("No documents found for search criteria");
                return ApiResponse.error(404, "No data found");
            }

            log.info("Search result size: {}", documentList.size());

            return ApiResponse.success("获取文档列表成功", documentList);

        } catch (Exception e) {
            log.error("Error searching document list", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
}