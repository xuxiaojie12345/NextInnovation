package com.web.app.service;

import com.web.app.domain.DoctypeListResponse;

import java.util.List;

/**
 * UD03文档类型列表服务接口
 */
public interface UD03SelectHdocdocumentlistService {

    /**
     * 获取文档类型列表
     * 
     * @return 文档类型列表
     */
    List<DoctypeListResponse> getDoctypeList();
}
