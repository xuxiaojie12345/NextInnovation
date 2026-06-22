package com.web.app.service;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;

/**
 * UD09 - 删除用户定义规则服务接口
 */
public interface UD09DeleteHdocuserdefinedrulesService {

    /**
     * 搜索用户定义规则
     */
    UD09DeleteHdocuserdefinedrulesResponse searchRules(UD09DeleteHdocuserdefinedrulesRequest request);

    /**
     * 删除选中的记录
     */
    UD09DeleteHdocuserdefinedrulesResponse deleteSelected(UD09DeleteHdocuserdefinedrulesRequest request);
}
