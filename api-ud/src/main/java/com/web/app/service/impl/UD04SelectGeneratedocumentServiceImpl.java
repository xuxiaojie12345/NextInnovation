package com.web.app.service.impl;

import com.web.app.dto.UD04SelectGeneratedocumentResponse;
import com.web.app.entity.UD04GenerateDocumentVO;
import com.web.app.mapper.UD04SelectGeneratedocumentMapper;
import com.web.app.service.UD04SelectGeneratedocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * UD04 生成文档数据服务实现类
 * 
 * 功能说明：实现获取生成文档数据的业务逻辑
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Slf4j
@Service
public class UD04SelectGeneratedocumentServiceImpl implements UD04SelectGeneratedocumentService {

    @Autowired
    private UD04SelectGeneratedocumentMapper ud04Mapper;

    /**
     * 根据底盘系列和底盘编号获取生成文档数据
     * 处理流程：
     * 1. 对参数进行合法性校验
     * 2. 调用 Mapper 通过多表关联查询获取生成文档数据
     * 3. 无匹配结果时返回错误提示
     * 4. 有结果则封装响应对象返回
     * 
     * @param chassisSerie 底盘系列
     * @param chassisNo    底盘编号
     * @return UD04SelectGeneratedocumentResponse 响应对象
     */
    @Override
    public UD04SelectGeneratedocumentResponse getUD04GenerateDocumentData(String chassisSerie, String chassisNo) {
        log.info("开始查询生成文档数据，chassisSerie: {}, chassisNo: {}", chassisSerie, chassisNo);

        try {
            // 4.2 参数校验
            String validationError = validateParameters(chassisSerie, chassisNo);
            if (validationError != null) {
                log.warn("参数验证失败: {}", validationError);
                return UD04SelectGeneratedocumentResponse.error(400, validationError);
            }

            // 4.5 通过数据访问层查询数据库
            UD04GenerateDocumentVO documentData = ud04Mapper.selectDocumentData(chassisSerie, chassisNo);

            // 4.6 查询核心验证逻辑
            if (documentData == null) {
                log.warn("未找到匹配的文档数据，chassisSerie: {}, chassisNo: {}", chassisSerie, chassisNo);
                // 无匹配结果时返回友好提示
                return UD04SelectGeneratedocumentResponse.error(404, "We can not get the data. Please try again.");
            }

            log.info("查询成功，找到文档数据");

            // 4.7 封装响应对象
            UD04SelectGeneratedocumentResponse.DocumentData responseData = new UD04SelectGeneratedocumentResponse.DocumentData();
            responseData.setOrdernumber(documentData.getOrdernumber());
            responseData.setBuild(documentData.getBuild());
            responseData.setSpec(documentData.getSpec());
            responseData.setCustomerAdap(documentData.getCustomerAdap());
            responseData.setCountryOfOperation(documentData.getCountryOfOperation());
            responseData.setLoadIndex(documentData.getLoadIndex());
            responseData.setAct(documentData.getAct());
            responseData.setVariable(documentData.getVariable());

            return UD04SelectGeneratedocumentResponse.success(responseData);

        } catch (Exception e) {
            log.error("查询生成文档数据失败，chassisSerie: {}, chassisNo: {}", chassisSerie, chassisNo, e);
            // 返回错误响应
            return UD04SelectGeneratedocumentResponse.error(500, "System error. Please try again later.");
        }
    }

    /**
     * 参数验证
     * 
     * @param chassisSerie 底盘系列
     * @param chassisNo    底盘编号
     * @return 错误消息，如果验证通过返回null
     */
    private String validateParameters(String chassisSerie, String chassisNo) {
        // 验证 chassisSerie
        if (!StringUtils.hasText(chassisSerie)) {
            return "Chassis serie is required.";
        }
        if (chassisSerie.length() > 5) {
            return "Chassis serie must be at most 5 characters.";
        }
        if (!chassisSerie.matches("^[a-zA-Z0-9]+$")) {
            return "Chassis serie must contain only alphanumeric characters.";
        }

        // 验证 chassisNo
        if (!StringUtils.hasText(chassisNo)) {
            return "Chassis no is required.";
        }
        if (chassisNo.length() > 10) {
            return "Chassis no must be at most 10 characters.";
        }
        if (!chassisNo.matches("^[0-9]+$")) {
            return "Chassis no must contain only digits.";
        }

        return null; // 验证通过
    }
}
