package com.web.app.service.impl;

import com.web.app.domain.UD06ModificationDetailResponse;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.UD06SaveModificationsService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UD06_SaveModifications 服务实现类
 */
@Service
public class UD06SaveModificationsServiceImpl implements UD06SaveModificationsService {

    private static final Logger logger = LogManager.getLogger(UD06SaveModificationsServiceImpl.class);

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public UD06ModificationDetailResponse selectModificationDetails(String serie, String chassisNo) {
        logger.info("开始查询修改详情，serie: {}, chassisNo: {}", serie, chassisNo);

        // 执行SQL查询
        List<LinkedHashMap<String, Object>> records = hdocAdcaModificationMapper.selectModificationDetails(serie, chassisNo);

        if (records == null || records.isEmpty()) {
            logger.warn("未找到修改记录，serie: {}, chassisNo: {}", serie, chassisNo);
            throw new RuntimeException("No modification records found");
        }

        // 取第一条记录获取 Doctype 和 VERS
        LinkedHashMap<String, Object> first = records.get(0);
        String doctype = (String) first.get("DOCTYPE");
        String version = String.valueOf(first.get("VERS"));

        // 拼接所有 Storing 信息，格式：VAR1=VAL1; VAR2=VAL2
        String storingInfo = records.stream()
                .map(r -> (String) r.get("Storing"))
                .collect(Collectors.joining("; "));

        // FOUND UNRELEASED VERSION: 有记录则为 "1"
        String foundUnreleasedVersion = "1";

        // 封装响应
        UD06ModificationDetailResponse response = new UD06ModificationDetailResponse();
        response.setDoctype(doctype);
        response.setVersion(version);
        response.setStoringInfo(storingInfo);
        response.setFoundUnreleasedVersion(foundUnreleasedVersion);

        logger.info("修改详情查询成功，doctype: {}, version: {}", doctype, version);
        return response;
    }
}
