package com.web.app.service;

import com.web.app.domain.UD06ModificationDetailResponse;

/**
 * UD06_SaveModifications 服务接口
 * 提供修改详情的查询功能
 */
public interface UD06SaveModificationsService {

    /**
     * 查询修改详情
     * 根据系列编号和底盘号，查询HDOC_ADCA_MODIFICATION表，
     * 获取Doctype, Version, Storing等信息
     *
     * @param serie 系列编号
     * @param chassisNo 底盘号
     * @return 修改详情响应
     */
    UD06ModificationDetailResponse selectModificationDetails(String serie, String chassisNo);
}
