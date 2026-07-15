package com.web.app.service;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;

/**
 * UD09 删除用户定义规则服务接口
 *
 * 功能说明：定义用户定义规则的搜索和删除业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD09DeleteHdocuserdefinedrulesService {

    /**
     * 搜索用户定义规则
     *
     * @param request 搜索请求参数
     * @return 响应对象
     */
    UD09DeleteHdocuserdefinedrulesResponse UD09Seach(UD09DeleteHdocuserdefinedrulesRequest request);

    /**
     * 批量删除用户定义规则
     *
     * @param request 删除请求参数
     * @return 响应对象
     */
    UD09DeleteHdocuserdefinedrulesResponse UD09DeleteSelected(UD09DeleteHdocuserdefinedrulesRequest request);
}
