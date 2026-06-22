package com.web.app.service.impl;

import com.web.app.domain.GenerateDocumentQueryResponse;
import com.web.app.mapper.UD04Mapper;
import com.web.app.service.UD04Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * UD04业务逻辑实现类
 * 对应详细设计：DES-GenerateDocumentPage-001
 *
 * 查询逻辑：
 * 根据chassisSeries和chassisNo关联查询
 * HDOC_REC_DATA_VDA_GENERAL、HDOC_REC_DATA_OM、
 * HDOC_REC_DATA_KOLA_TIRE_MASTER、HDOC_ADCA_CHANGE、
 * HDOC_ADCA_MODIFICATION表，获取底盘完整信息
 */
@Service
public class UD04ServiceImpl implements UD04Service {

    private static final Logger logger = LoggerFactory.getLogger(UD04ServiceImpl.class);

    @Autowired
    private UD04Mapper ud04Mapper;

    @Override
    public GenerateDocumentQueryResponse selectGeneratedDocument(String chassisSeries, String chassisNo, String documentType) {
        logger.debug("UD04ServiceImpl.selectGeneratedDocument - series: {}, chassisNo: {}, documentType: {}",
                chassisSeries, chassisNo, documentType);

        try {
            // 调用Mapper层查询底盘文档信息
            GenerateDocumentQueryResponse response = ud04Mapper.selectGeneratedDocument(chassisSeries, chassisNo);

            if (response == null) {
                logger.warn("No data found for chassisNo: {}", chassisNo);
                return null;
            }

            // 设置固定值
            response.setMasterMarket("-EU");

            // 设置服务器当前时间
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            response.setDate(LocalDateTime.now().format(formatter));

            // 设置程序版本号（可从配置获取，当前使用固定值）
            response.setHdocVersion("v1.0.0");

            // 判断ADCA变更状态
            // 若ACT为"1"、"ACTIVE"或"Y"，则modifyDocLink为"ACTIVE"
            // 否则modifyDocLink为"INACTIVE"
            String act = response.getModifyDocLink();
            if ("1".equals(act) || "ACTIVE".equals(act) || "Y".equals(act)) {
                response.setModifyDocLink("ACTIVE");
            } else {
                response.setModifyDocLink("INACTIVE");
            }

            logger.info("UD04 data retrieved successfully for chassisNo: {}", chassisNo);
            return response;

        } catch (Exception e) {
            logger.error("Error querying UD04 data for chassisNo: " + chassisNo, e);
            throw e;
        }
    }
}
