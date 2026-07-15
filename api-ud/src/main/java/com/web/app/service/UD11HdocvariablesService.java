package com.web.app.service;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;

/**
 * UD11 HDOC变量搜索服务接口
 *
 * 功能说明：定义HDOC变量搜索查询业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD11HdocvariablesService {

    /**
     * 搜索查询HDOC变量
     *
     * @param request 搜索请求参数
     * @return 响应对象
     */
    UD11HdocvariablesResponse UD11Search(UD11HdocvariablesRequest request);
}
