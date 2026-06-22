package com.web.app.service;

import com.web.app.domain.GenerateDocumentData;

/**
 * UD04生成文档服务接口
 */
public interface UD04SelectGeneratedocumentService {

    /**
     * 获取生成文档数据
     * 
     * @param chassisSeries 底盘系列
     * @param chassisNo 底盘号
     * @return 生成文档数据
     */
    GenerateDocumentData getGenerateDocumentData(String chassisSeries, String chassisNo);
}
