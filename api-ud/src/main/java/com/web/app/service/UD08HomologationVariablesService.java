package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD08_HomologationVariables 服务接口
 * 提供认证参数管理（产品类别、市场、自定义规则）的CRUD操作
 */
public interface UD08HomologationVariablesService {

    /**
     * 获取产品类别列表
     *
     * @return 产品类别列表
     */
    List<Map<String, Object>> selectProductClassMaster();

    /**
     * 获取市场列表
     *
     * @return 市场列表
     */
    List<Map<String, Object>> selectMarketMaster();

    /**
     * 检查用户定义规则是否存在（存在性检查）
     *
     * @param pc     产品类别
     * @param number 编号
     * @param market 市场
     * @return 存在返回true
     */
    boolean checkUserDefinedRuleExists(String pc, String number, String market);

    /**
     * 检查Variable是否在HDOC_VARIABLES表中存在
     *
     * @param variable 变量名
     * @return 存在返回true
     */
    boolean checkHdocVariableExists(String variable);

    /**
     * 新增用户定义规则
     *
     * @param params 规则参数
     */
    void addUserDefinedRule(Map<String, Object> params);

    /**
     * 更新用户定义规则
     *
     * @param params 规则参数
     */
    void updateUserDefinedRule(Map<String, Object> params);

    /**
     * 删除用户定义规则
     *
     * @param pc     产品类别
     * @param number 编号
     * @param market 市场
     */
    void deleteUserDefinedRule(String pc, String number, String market);
}
