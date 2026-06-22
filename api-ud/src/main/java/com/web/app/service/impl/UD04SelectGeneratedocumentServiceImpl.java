package com.web.app.service.impl;

import com.web.app.domain.GenerateDocumentData;
import com.web.app.mapper.GenerateDocumentMapper;
import com.web.app.service.UD04SelectGeneratedocumentService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * UD04生成文档服务实现类
 */
@Service
public class UD04SelectGeneratedocumentServiceImpl implements UD04SelectGeneratedocumentService {

    private static final Logger logger = LogManager.getLogger(UD04SelectGeneratedocumentServiceImpl.class);

    @Autowired
    private GenerateDocumentMapper generateDocumentMapper;

    /**
     * 获取生成文档数据
     * 
     * @param chassisSeries 底盘系列
     * @param chassisNo 底盘号
     * @return 生成文档数据
     */
    @Override
    public GenerateDocumentData getGenerateDocumentData(String chassisSeries, String chassisNo) {
        logger.info("开始查询生成文档数据，chassisSeries: {}, chassisNo: {}", chassisSeries, chassisNo);

        // 调用Mapper执行SQL查询
        GenerateDocumentData data = generateDocumentMapper.selectGenerateDocumentData(chassisSeries, chassisNo);

        // 验证查询结果
        if (data == null) {
            logger.warn("未找到底盘号对应的数据，chassisSeries: {}, chassisNo: {}", chassisSeries, chassisNo);
            throw new RuntimeException("No data found for chassis: " + chassisSeries + chassisNo);
        }

        // 设置固定值和补充信息
        
        // 设置当前时间
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        data.setDate(now.format(formatter));
        
        // 处理替换参数列表
        if (data.getReplacementParams() == null) {
            data.setReplacementParams(new ArrayList<>());
        }

        logger.info("生成文档数据查询成功，orderNumber: {}", data.getOrderNumber());
        return data;
    }
}
