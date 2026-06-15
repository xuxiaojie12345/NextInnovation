package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;

/**
 * UD08 Homologation Variables Service
 * 提供Homologation Variables相关业务逻辑
 */
public interface UD08HomologationVariablesService {
    
    /**
     * 获取产品类别主数据
     * 
     * @return API响应，包含产品类别列表
     */
    ApiResponse<?> getProductClassMaster();
    
    /**
     * 获取市场主数据
     * 
     * @return API响应，包含市场列表
     */
    ApiResponse<?> getMarketMaster();
    
    /**
     * 获取HDOC变量信息
     * 
     * @return API响应，包含HDOC变量列表
     */
    ApiResponse<?> getHdocVariables();
    
    /**
     * 添加用户定义规则
     * 
     * @param rules 用户定义规则
     * @return API响应
     */
    ApiResponse<?> addUserDefinedRule(HdocUserDefinedRules rules);
    
    /**
     * 更新用户定义规则
     * 
     * @param rules 用户定义规则
     * @return API响应
     */
    ApiResponse<?> updateUserDefinedRule(HdocUserDefinedRules rules);
    
    /**
     * 删除用户定义规则
     * 
     * @param pc Product class
     * @param num Number
     * @param market Market
     * @param updateUser 更新用户（从前端传入）
     * @return API响应
     */
    ApiResponse<?> deleteUserDefinedRule(String pc, Integer num, String market, String updateUser);
    
}
