package com.web.app.service;

import com.web.app.domain.SelectVariableModificationResponse;
import com.web.app.dto.UD05UpdateModificationRequest;

/**
 * UD05_ModifyDocument 服务接口
 * 提供变量修改信息的查询和更新功能
 */
public interface UD05ModifyDocumentService {

    /**
     * 查询变量修改信息（Select）
     * 根据系列编号和底盘号，查询HDOC_VARIABLES和HDOC_ADCA_MODIFICATION表，
     * 获取所有变量及其对应的修改值
     *
     * @param serie 系列编号
     * @param chassisNo 底盘号
     * @return 变量修改列表
     */
    SelectVariableModificationResponse selectVariableModification(String serie, String chassisNo);

    /**
     * 更新修改变量值（Update）
     * 根据请求中的修改列表，批量更新HDOC_ADCA_MODIFICATION表中的NEWVAL字段
     *
     * @param request 更新请求对象（包含系列编号、底盘号、修改列表）
     */
    void updateModification(UD05UpdateModificationRequest request);
}
