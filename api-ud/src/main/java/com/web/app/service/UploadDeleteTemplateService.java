package com.web.app.service;

import com.web.app.dto.UploadDeleteTemplateRequest;
import com.web.app.dto.UploadDeleteTemplateResponse;

/**
 * 上传删除模板服务接口
 */
public interface UploadDeleteTemplateService {

    /**
     * 上传模板文件
     *
     * @param request 上传请求
     * @return 上传响应
     */
    UploadDeleteTemplateResponse upload(UploadDeleteTemplateRequest request);

    /**
     * 删除模板文件
     *
     * @param request 删除请求
     * @return 删除响应
     */
    UploadDeleteTemplateResponse delete(UploadDeleteTemplateRequest request);

    /**
     * 获取所有Market列表
     *
     * @return Market列表响应
     */
    UploadDeleteTemplateResponse getMarkets();

    /**
     * 获取指定Market下的模板列表
     *
     * @param market Market名称
     * @return 模板列表响应
     */
    UploadDeleteTemplateResponse getTemplates(String market);
}
