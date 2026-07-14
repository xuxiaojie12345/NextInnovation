package com.web.app.service.impl;

import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;
import com.web.app.mapper.UD20MarketDocumentSettingsMapper;
import com.web.app.service.UD20MarketDocumentSettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UD20-1 市场文档设置更新服务实现类
 *
 * 功能说明：实现文档设置更新的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Slf4j
@Service
public class UD20MarketDocumentSettingsServiceImpl implements UD20MarketDocumentSettingsService {

    @Autowired
    private UD20MarketDocumentSettingsMapper ud201Mapper;

    /**
     * 更新文档列表
     * 对应设计文档 4.4 - 业务实现层执行核心查询逻辑
     *
     * 处理流程：
     * 1. 对请求参数进行非空、合法性校验
     * 2. 检查该 DOCTYPE 是否存在
     * 3. 更新 HDOC_DOCUMENT_LIST 表数据
     *
     * @param request 请求对象
     * @return UD20MarketDocumentSettingsResponse 响应对象
     */
    @Override
    @Transactional
    public UD20MarketDocumentSettingsResponse updateDocument(UD20MarketDocumentSettingsRequest request) {
        log.info("开始UD20-1更新文档列表, request: {}", request);

        // 4.4 对请求参数进行非空、合法性校验
        if (request.getDoctype() == null || request.getDoctype().trim().isEmpty()) {
            log.warn("UD20-1参数校验失败: Document type不能为空");
            return UD20MarketDocumentSettingsResponse.error(400, "Document type不能为空");
        }

        String doctype = request.getDoctype().trim();

        try {
            // 先检查该 DOCTYPE 是否存在
            int count = ud201Mapper.countByDoctype(doctype);
            if (count <= 0) {
                log.warn("UD20-1 Document type不存在: {}", doctype);
                return UD20MarketDocumentSettingsResponse.error(404,
                        "Document type does not exists. Please enter the correct content.");
            }

            // 4.5 通过数据访问层更新 HDOC_DOCUMENT_LIST 表
            String registerUser = (request.getRegisterUser() != null && !request.getRegisterUser().trim().isEmpty())
                    ? request.getRegisterUser().trim()
                    : "SYSTEM";
            String process = "UD20MarketDocumentSettings";
            int updatedRows = ud201Mapper.updateDocumentList(
                    doctype,
                    registerUser,
                    request.getUser(),
                    request.getDate(),
                    process);

            if (updatedRows > 0) {
                log.info("UD20-1更新成功，影响 {} 条记录", updatedRows);
                // 4.6 封装响应对象
                return UD20MarketDocumentSettingsResponse.success("保存成功");
            } else {
                log.warn("UD20-1更新失败，未更新任何记录");
                return UD20MarketDocumentSettingsResponse.error(500, "更新失败");
            }

        } catch (Exception e) {
            log.error("UD20-1更新文档列表失败", e);
            return UD20MarketDocumentSettingsResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
