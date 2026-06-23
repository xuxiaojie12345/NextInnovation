package com.web.app.service;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;

/**
 * UD06 保存修改内容服务接口
 *
 * 功能说明：提供UD06保存修改内容业务逻辑接口
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
public interface UD06SaveModificationsService {

    /**
     * 查询保存修改内容
     *
     * @param request 查询请求对象
     * @return 响应对象
     */
    UD06SaveModificationsResponse UD06SelectHdocAdcaModification(UD06SaveModificationsRequest request);
}
