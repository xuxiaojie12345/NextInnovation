package com.web.app.service;

import com.web.app.domain.SaveModificationsQueryResponse;

/**
 * UD06业务逻辑接口
 * 对应详细设计：DES-SaveModifications-001
 *
 * 提供ADCA修改信息查询功能：
 * UD06SelectHdocAdcaModification - 查询修改信息
 */
public interface UD06Service {

    /**
     * UD06SelectHdocAdcaModification
     * 根据serie和chno查询ADCA修改信息
     *
     * @param serie 底盘系列号
     * @param chno  底盘编号
     * @return ADCA修改信息
     */
    SaveModificationsQueryResponse selectHdocAdcaModification(String serie, String chno);
}
