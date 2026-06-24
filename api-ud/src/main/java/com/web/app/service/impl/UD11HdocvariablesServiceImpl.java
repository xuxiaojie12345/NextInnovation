package com.web.app.service.impl;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;
import com.web.app.dto.UD11HdocvariablesResponse.VariableData;
import com.web.app.mapper.UD11HdocvariablesMapper;
import com.web.app.service.UD11HdocvariablesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UD11 HDOC变量搜索服务实现类
 *
 * 功能说明：实现HDOC变量的搜索查询业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD11HdocvariablesServiceImpl implements UD11HdocvariablesService {

    @Autowired
    private UD11HdocvariablesMapper ud11Mapper;

    @Override
    public UD11HdocvariablesResponse searchVariables(UD11HdocvariablesRequest request) {
        log.info("开始UD11搜索HDOC变量, request: {}", request);
        try {
            List<VariableData> resultList = ud11Mapper.searchVariables(request);

            if (resultList == null || resultList.isEmpty()) {
                log.warn("UD11搜索未找到匹配的HDOC变量");
                return UD11HdocvariablesResponse.success("查询成功", resultList);
            }

            log.info("UD11搜索成功, 找到 {} 条记录", resultList.size());
            return UD11HdocvariablesResponse.success("查询成功", resultList);
        } catch (Exception e) {
            log.error("UD11搜索HDOC变量失败", e);
            return UD11HdocvariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
