package com.web.app.service;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;

/**
 * UD16 AD/CA变更服务接口
 *
 * 功能说明：定义AD/CA变更记录的添加、删除、检查的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD16ADChangeService {

    /**
     * 添加AD/CA变更记录
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD16ADChangeResponse addChange(UD16ADChangeRequest request);

    /**
     * 删除AD/CA变更记录
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD16ADChangeResponse deleteChange(UD16ADChangeRequest request);

    /**
     * 检查AD/CA变更记录
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD16ADChangeResponse checkChange(UD16ADChangeRequest request);
}
