package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD201Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UD20-1 Service Implementation
 * 实现更新文档类型列表的业务逻辑
 */
@Slf4j
@Service
public class UD201ServiceImpl implements UD201Service {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<?> updateHdocDocumentList(String doctype, String user, String date) {
        log.info("========== UD20-1 Service: Update HDOC_DOCUMENT_LIST ==========");
        log.info("doctype: {}, user: {}, date: {}", doctype, user, date);

        try {
            // Step 1: 检查doctype是否存在
            int count = hdocDocumentListMapper.countByDoctype(doctype);
            if (count == 0) {
                log.warn("Document type does not exist: {}", doctype);
                return ApiResponse.error(404, "Document type does not exists. Please enter the correct content.");
            }

            // Step 2: 先删除旧记录
            hdocDocumentListMapper.deleteHdocDocumentList(doctype);

            // Step 3: 再插入新记录
            int result = hdocDocumentListMapper.insertHdocDocumentList(
                    doctype,
                    user,
                    date,
                    user,
                    "UD20-1_UPDATE"
            );

            if (result > 0) {
                log.info("Update (delete+insert) successful for doctype: {}", doctype);
                return ApiResponse.success("更新成功", null);
            } else {
                log.error("Insert failed for doctype: {}", doctype);
                return ApiResponse.error(500, "更新失败");
            }

        } catch (Exception e) {
            log.error("Error updating HDOC_DOCUMENT_LIST", e);
            return ApiResponse.error(500, "更新失败");
        }
    }
}
