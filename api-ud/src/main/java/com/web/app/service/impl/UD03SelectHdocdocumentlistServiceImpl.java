package com.web.app.service.impl;

import com.web.app.domain.DoctypeListResponse;
import com.web.app.domain.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UD03文档类型列表服务实现类
 */
@Service
public class UD03SelectHdocdocumentlistServiceImpl implements UD03SelectHdocdocumentlistService {

    private static final Logger logger = LogManager.getLogger(UD03SelectHdocdocumentlistServiceImpl.class);

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    /**
     * 获取文档类型列表
     * 
     * @return 文档类型列表
     */
    @Override
    public List<DoctypeListResponse> getDoctypeList() {
        logger.info("开始获取文档类型列表");

        // 查询所有文档类型（SQL中已做去重处理）
        List<HdocDocumentList> documentList = hdocDocumentListMapper.selectAllDoctypes();

        // 转换为响应对象
        List<DoctypeListResponse> responseList = documentList.stream()
                .map(doc -> {
                    DoctypeListResponse response = new DoctypeListResponse();
                    response.setDoctype(doc.getDoctype());
                    return response;
                })
                .collect(Collectors.toList());

        logger.info("文档类型列表获取成功，共{}条记录", responseList.size());
        return responseList;
    }
}
