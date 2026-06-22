package com.web.app.service.impl;

import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD20GetDocumentListService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD20_GetDocumentList 服务实现类
 */
@Service
public class UD20GetDocumentListServiceImpl implements UD20GetDocumentListService {

    private static final Logger logger = LogManager.getLogger(UD20GetDocumentListServiceImpl.class);

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public List<Map<String, Object>> getDocumentList(Map<String, Object> params) {
        logger.info("查询文档列表");
        return hdocDocumentListMapper.selectByConditions(params);
    }
}
