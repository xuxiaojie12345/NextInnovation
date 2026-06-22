package com.web.app.service;

import com.web.app.dto.UD04SelectGeneratedocumentResponse;

/**
 * UD04 生成文档数据服务接口
 * 
 * 功能说明：提供获取生成文档数据的业务逻辑
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
public interface UD04SelectGeneratedocumentService {

    /**
     * 根据底盘系列和底盘编号获取生成文档数据
     * 对应设计文档 4.3 - 控制器层调用此方法
     * 
     * 业务逻辑：
     * 1. 对参数进行合法性校验（chassisSerie: 最大5字符，半角英数字；chassisNo: 最大10字符，半角数字）
     * 2. 通过多表关联查询获取生成文档所需数据
     * 3. 关联表：HDOC_REC_DATA_VDA_GENERAL, HDOC_REC_DATA_OM, 
     *           HDOC_REC_DATA_KOLA_TIRE_MASTER, HDOC_ADCA_CHANGE, HDOC_ADCA_MODIFICATION
     * 4. 无匹配结果时返回错误提示："Chassis no is not exists."
     * 5. 有结果则返回查询结果
     * 
     * @param chassisSerie 底盘系列
     * @param chassisNo 底盘编号
     * @return UD04SelectGeneratedocumentResponse 响应对象，包含生成文档数据
     */
    UD04SelectGeneratedocumentResponse getUD04GenerateDocumentData(String chassisSerie, String chassisNo);
}
