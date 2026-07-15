package com.web.app.service;

import com.web.app.domain.UD09BatchDeleteRequest;
import com.web.app.domain.UD09BatchDeleteResponse;
import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.entity.HdocUserDefinedRules;

import java.util.List;

/**
 * UD09业务逻辑接口
 * 用户自定义规则搜索结果列表与批量删除
 */
 /**

  * UD09Service

  */

public interface UD09Service {

    /**
     * UD09Search - 根据搜索条件查询用户自定义规则列表
     * @return 用户自定义规则列表
     */
    List<HdocUserDefinedRules> UD09Search(UD08SearchRequest request);

    /**
     * UD09DeleteSelected - 批量删除用户自定义规则
     * @return 批量删除结果
     */
    UD09BatchDeleteResponse UD09DeleteSelected(List<UD09BatchDeleteRequest> requests);
}
