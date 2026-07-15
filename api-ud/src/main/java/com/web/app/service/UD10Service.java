package com.web.app.service;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;

import java.util.List;

/**
 * UD10业务逻辑接口
 * HDOC_VARIABLES表的增删改查
 * 对应全体APIのプロンプト.txt 【UD10HdocvariablesApi】
 */
 /**

  * UD10Service

  */

public interface UD10Service {

    /**
     * UD10Search - 根据搜索条件查询变量定义列表
     */
    List<HdocVariable> search(UD10SearchRequest request);

    /**
     * 根据Variable查询变量定义详情
     */
    HdocVariable selectByVariable(String variable);

    /**
     * UD10Add - 新增变量定义记录
     * @return null表示成功，非null表示错误消息
     */
    String add(String variable, String type, String description, String userid, String registerDatetime);

    /**
     * UD10Update - 更新变量定义记录
     * @return null表示成功，非null表示错误消息
     */
    String update(String variable, String type, String description, String userid, String registerDatetime);

    /**
     * UD10Delete - 删除变量定义记录
     * @return null表示成功，非null表示错误消息
     */
    String delete(String variable);
}
