package com.web.app.service;

import com.web.app.domain.ModifyDocumentQueryResponse;

/**
 * UD05业务逻辑接口
 * 对应详细设计：DES-ModifyDocument-001
 *
 * 提供文档变量修改与保存功能：
 * 1. UD05SelectVariableModification - 查询变量列表
 * 2. UD05UpdateHdocAdcaModification - 更新变量值
 */
public interface UD05Service {

    /**
     * UD05SelectVariableModification
     * 根据serie和chno查询变量修改信息
     *
     * @param serie 底盘系列号
     * @param chno  底盘编号
     * @return 变量修改信息响应
     */
    ModifyDocumentQueryResponse selectVariableModification(String serie, String chno);

    /**
     * UD05UpdateHdocAdcaModification
     * 更新HDOC_ADCA_MODIFICATION表的NEWVAL字段
     *
     * @param serie         底盘系列号
     * @param chno          底盘编号
     * @param variable      变量名
     * @param modifiedValue 修改后的值
     * @return 是否更新成功
     */
    boolean updateHdocAdcaModification(String serie, String chno, String variable, String modifiedValue);
}
