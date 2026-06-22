package com.web.app.service;

import java.util.Map;

/**
 * UD15_Selecthdocsenddatavinplate 服务接口
 * 提供VIN Plate数据的查看与状态更新功能
 */
public interface UD15SelecthdocsenddatavinplateService {

    /**
     * 查看VIN Plate信息
     *
     * @param chassisNumber 底盘号
     * @return VIN Plate数据
     */
    Map<String, Object> viewInfo(String chassisNumber);

    /**
     * 设置重新生成（Set Regenerate）
     *
     * @param chassisNumber 底盘号
     */
    void setRegenerate(String chassisNumber);

    /**
     * 设置完成（Set OK）
     *
     * @param chassisNumber 底盘号
     */
    void setOk(String chassisNumber);

    /**
     * 切换到高级信息（Change to Advanced）
     *
     * @param chassisNumber 底盘号
     */
    void changeToAdvanced(String chassisNumber);
}
