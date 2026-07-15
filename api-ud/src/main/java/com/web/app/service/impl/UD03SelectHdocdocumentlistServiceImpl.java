package com.web.app.service.impl;

import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.mapper.UD03SelectHdocdocumentlistMapper;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UD03 文档类型列表服务实现类
 * 
 * 功能说明：实现获取文档类型列表的业务逻辑
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Slf4j
@Service
public class UD03SelectHdocdocumentlistServiceImpl implements UD03SelectHdocdocumentlistService {

    @Autowired
    private UD03SelectHdocdocumentlistMapper ud03Mapper;

    /**
     * 获取文档类型列表
     * 处理流程：
     * 1. 调用 Mapper 查询 HDOC_DOCUMENT_LIST 表
     * 2. 获取所有 DOCTYPE 并按 DOCTYPE 排序
     * 3. 封装响应对象返回
     * 
     * @return UD03SelectHdocdocumentlistResponse 响应对象
     */
    @Override
    public UD03SelectHdocdocumentlistResponse getHdocDocumentList() {
        log.info("开始查询文档类型列表");

        try {
            // 4.5 通过数据访问层查询数据库
            List<String> doctypeList = ud03Mapper.selectDoctypeList();

            if (doctypeList == null || doctypeList.isEmpty()) {
                log.warn("未查询到任何文档类型数据");
                // 返回空列表，而不是错误
                return UD03SelectHdocdocumentlistResponse.success(doctypeList);
            }
            // 4.6 封装响应对象
            return UD03SelectHdocdocumentlistResponse.success(doctypeList);

        } catch (Exception e) {
            log.error("查询文档类型列表异常", e);
            // 返回错误响应
            return UD03SelectHdocdocumentlistResponse.error(500, "System error. Please try again later.");
        }
    }
}
