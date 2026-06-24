package com.web.app.service;

import com.web.app.dto.GeneratedDocumentDto;

/**
 * UD04 Service接口 - 获取生成文档数据
 */
public interface UD04SelectGeneratedocumentService {

    /**
     * 查询生成文档数据
     *
     * @param chassisSeries 底盘系列
     * @param chassisNo     底盘编号
     * @return 生成文档 DTO
     */
    GeneratedDocumentDto selectGeneratedDocument(String chassisSeries, String chassisNo);
}
