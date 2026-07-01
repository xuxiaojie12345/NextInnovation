package com.web.app.service.impl;

import com.web.app.dto.UD20GetDocumentListRequest;
import com.web.app.dto.UD20GetDocumentListResponse;
import com.web.app.mapper.UD20GetDocumentListMapper;
import com.web.app.service.UD20GetDocumentListService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UD20 获取文档列表服务实现类
 *
 * 功能说明：实现文档列表查询的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Slf4j
@Service
public class UD20GetDocumentListServiceImpl implements UD20GetDocumentListService {

    @Autowired
    private UD20GetDocumentListMapper ud20Mapper;

    /**
     * 查询文档列表
     * 对应设计文档 4.4 - 业务实现层执行核心查询逻辑
     *
     * 处理流程：
     * 1. 对请求参数进行非空、合法性校验
     * 2. 调用 Mapper 查询 HDOC_DOCUMENT_LIST 表
     * 3. 封装响应对象返回
     *
     * @param request 请求对象
     * @return UD20GetDocumentListResponse 响应对象
     */
    @Override
    public UD20GetDocumentListResponse getDocumentList(UD20GetDocumentListRequest request) {
        log.info("开始查询文档列表, request: {}", request);

        try {
            // 4.5 通过数据访问层查询数据库（动态SQL）
            List<UD20GetDocumentListResponse.DocumentData> documentList = ud20Mapper.selectDocumentList(request);

            if (documentList == null || documentList.isEmpty()) {
                log.warn("未查询到任何文档数据");
                return UD20GetDocumentListResponse.success("success", documentList);
            }

            log.info("查询成功，共找到 {} 条文档记录", documentList.size());

            // 4.6 封装响应对象
            return UD20GetDocumentListResponse.success("success", documentList);

        } catch (Exception e) {
            log.error("查询文档列表失败", e);
            return UD20GetDocumentListResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
