package com.web.app.service.impl;

import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.UD20MarketDocumentSettingsMapper;
import com.web.app.service.UD20MarketDocumentSettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * UD20 市场文档设置服务实现类
 *
 * 功能说明：实现文档列表查询的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD20MarketDocumentSettingsServiceImpl implements UD20MarketDocumentSettingsService {

    @Autowired
    private UD20MarketDocumentSettingsMapper ud20Mapper;

    @Override
    public UD20MarketDocumentSettingsResponse getDocumentList(UD20MarketDocumentSettingsRequest request) {
        log.info("开始UD20查询文档列表, request: {}", request);
        try {
            List<HdocDocumentList> list = ud20Mapper.selectDocumentList(
                    request.getDoctype(),
                    request.getRegisterUser(),
                    request.getRegisterDatetime());

            if (list == null || list.isEmpty()) {
                log.warn("UD20查询文档列表 - 未找到数据");
                return UD20MarketDocumentSettingsResponse.error(404, "未找到匹配的文档");
            }

            List<UD20MarketDocumentSettingsResponse.DocumentData> dataList = new ArrayList<>();
            if (list != null) {
                for (HdocDocumentList doc : list) {
                    UD20MarketDocumentSettingsResponse.DocumentData data = new UD20MarketDocumentSettingsResponse.DocumentData();
                    data.setDocumentType(doc.getDoctype());
                    data.setRegisterUser(doc.getRegisterUser());
                    data.setRegisterDateTime(doc.getRegisterDatetime() != null
                            ? doc.getRegisterDatetime().toString()
                            : null);
                    dataList.add(data);
                }
            }

            log.info("UD20查询文档列表成功，共 {} 条", dataList.size());
            return UD20MarketDocumentSettingsResponse.success("success", dataList);
        } catch (Exception e) {
            log.error("UD20查询文档列表失败", e);
            return UD20MarketDocumentSettingsResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
