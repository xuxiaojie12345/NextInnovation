package com.web.app.service;

import com.web.app.domain.UD08AddRequest;
import com.web.app.domain.UD08DeleteRequest;
import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.UD08UpdateRequest;
import com.web.app.domain.UD09BatchDeleteRequest;
import com.web.app.domain.UD09BatchDeleteResponse;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.domain.entity.MarketMaster;
import com.web.app.domain.entity.ProductClassMaster;

import java.util.List;

/**
 * UD08业务逻辑接口
 * 认证变量管理（Homologation Variables）
 */
public interface UD08Service {

    /**
     * UD08SelectProductclassmaster - 获取所有产品类别
     */
    List<ProductClassMaster> selectProductClassMaster();

    /**
     * UD08SelectMarketmaster - 获取所有市场信息
     */
    List<MarketMaster> selectMarketMaster();

    /**
     * UD08SelectHdocvariables - 获取所有HDOC变量
     */
    List<HdocVariable> selectHdocVariables();

    /**
     * UD08Add - 新增用户自定义规则
     * @return success/error message
     */
    String UD08Add(UD08AddRequest request);

    /**
     * UD08Update - 更新用户自定义规则
     * @return success/error message
     */
    String UD08Update(UD08UpdateRequest request);

    /**
     * UD08Delete - 删除用户自定义规则
     * @return success/error message
     */
    String UD08Delete(UD08DeleteRequest request);

    /**
     * UD08Search - 根据搜索条件查询用户自定义规则列表
     * @return 用户自定义规则列表
     */
    List<HdocUserDefinedRules> UD08Search(UD08SearchRequest request);

    /**
     * UD09DeleteHdocuserdefinedrules - 批量删除用户自定义规则
     * @param requests 待删除记录的主键列表
     * @return 批量删除结果（成功数、失败数、消息）
     */
    UD09BatchDeleteResponse batchDelete(List<UD09BatchDeleteRequest> requests);
}
