package com.web.app.service;

import com.web.app.dto.UD08HomologationVariablesResponse;
import com.web.app.dto.UD08UserDefinedRulesRequest;

/**
 * UD08 - Homologation Variables服务接口
 */
public interface UD08HomologationVariablesService {

    /**
     * 查询产品类别主数据
     */
    UD08HomologationVariablesResponse selectProductclassmaster();

    /**
     * 查询市场主数据
     */
    UD08HomologationVariablesResponse selectMarketmaster();

    /**
     * 查询HDoc变量
     */
    UD08HomologationVariablesResponse selectHdocvariables();

    /**
     * 新增用户定义规则
     */
    UD08HomologationVariablesResponse addUserDefinedRules(UD08UserDefinedRulesRequest request);

    /**
     * 更新用户定义规则
     */
    UD08HomologationVariablesResponse updateUserDefinedRules(UD08UserDefinedRulesRequest request);

    /**
     * 删除用户定义规则
     */
    UD08HomologationVariablesResponse deleteUserDefinedRules(UD08UserDefinedRulesRequest request);
}
