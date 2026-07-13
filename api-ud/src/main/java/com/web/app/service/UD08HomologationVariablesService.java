package com.web.app.service;

import com.web.app.dto.UD08HomologationVariablesRequest;
import com.web.app.dto.UD08HomologationVariablesResponse;

/**
 * UD08 认证变量规则服务接口
 *
 * 功能说明：定义认证变量规则的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD08HomologationVariablesService {

    /**
     * 获取产品类别列表
     *
     * @return 响应对象
     */
    UD08HomologationVariablesResponse UD08SelectProductclassmaster();

    /**
     * 获取市场列表
     *
     * @return 响应对象
     */
    UD08HomologationVariablesResponse UD08SelectMarketmaster();

    /**
     * 检查HDOC变量是否存在
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD08HomologationVariablesResponse UD08SelectHdocvariables(UD08HomologationVariablesRequest request);

    /**
     * 新增规则
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD08HomologationVariablesResponse UD08Add(UD08HomologationVariablesRequest request);

    /**
     * 更新规则
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD08HomologationVariablesResponse UD08Update(UD08HomologationVariablesRequest request);

    /**
     * 删除规则
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD08HomologationVariablesResponse UD08Delete(UD08HomologationVariablesRequest request);
}
