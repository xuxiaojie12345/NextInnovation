package com.web.app.service;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;

/**
 * UD10 HDOC变量管理服务接口
 *
 * 功能说明：定义HDOC变量的增删改业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD10HdocvariablesService {

    /**
     * 新增变量
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD10HdocvariablesResponse UD10Add(UD10HdocvariablesRequest request);

    /**
     * 更新变量
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD10HdocvariablesResponse UD10Update(UD10HdocvariablesRequest request);

    /**
     * 删除变量
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD10HdocvariablesResponse UD10Delete(UD10HdocvariablesRequest request);
}
