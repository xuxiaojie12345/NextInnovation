package com.web.app.service;

import java.util.Map;

/**
 * UD16_ADChange 服务接口
 * 提供AD Change信息的插入与删除功能
 */
public interface UD16SelectHdocAdcaChangeService {

    /**
     * 新增AD Change
     *
     * @param params 请求参数
     */
    void insert(Map<String, Object> params);

    /**
     * 删除AD Change
     *
     * @param params 请求参数
     */
    void delete(Map<String, Object> params);
}
