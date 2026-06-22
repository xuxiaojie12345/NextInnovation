package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD09_DeleteHdocuserdefinedrules 服务接口
 * 提供认证参数的搜索与批量删除功能
 */
public interface UD09DeleteHdocuserdefinedrulesService {

    /**
     * 根据条件搜索认证参数规则
     *
     * @param params 查询条件
     * @return 规则记录列表
     */
    List<Map<String, Object>> search(Map<String, Object> params);

    /**
     * 批量删除选中的认证参数规则
     *
     * @param selectedRecords 选中的记录列表
     */
    void deleteSelected(List<Map<String, Object>> selectedRecords);
}
