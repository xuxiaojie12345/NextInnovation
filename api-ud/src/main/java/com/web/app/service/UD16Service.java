package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocAdcaChange;

/**
 * UD16 Service
 * 提供AD Change的检查、添加、删除业务逻辑
 */
public interface UD16Service {

    /**
     * 检查AD Change记录
     *
     * @param request 请求参数（serieChnr）
     * @return API响应
     */
    ApiResponse<?> checkADChange(HdocAdcaChange request);

    /**
     * 添加AD Change记录
     *
     * @param request 请求参数（serieChnr, desc）
     * @return API响应
     */
    ApiResponse<?> addADChange(HdocAdcaChange request);

    /**
     * 删除AD Change记录（逻辑删除）
     *
     * @param request 请求参数（serieChnr）
     * @return API响应
     */
    ApiResponse<?> deleteADChange(HdocAdcaChange request);
}
