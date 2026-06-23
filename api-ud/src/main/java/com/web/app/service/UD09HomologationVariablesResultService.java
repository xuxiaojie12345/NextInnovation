package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD09_HomologationVariablesResult 服务接口
 * 提供认证参数检索结果查询和删除操作
 */
public interface UD09HomologationVariablesResultService {

    /**
     * 根据条件检索用户定义规则
     *
     * @param params 检索条件
     * @return 规则记录列表
     */
    List<Map<String, Object>> searchUserDefinedRules(Map<String, Object> params);

    /**
     * 删除用户定义规则
     *
     * @param pc     产品类别
     * @param number 编号
     * @param market 市场
     */
    void deleteUserDefinedRule(String pc, String number, String market);
}
