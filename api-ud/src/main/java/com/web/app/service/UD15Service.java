package com.web.app.service;

import java.util.Map;

/**
 * UD15SelecthdocsenddatavinplateApi 服务接口
 */
public interface UD15Service {

    /**
     * 处理VIN Plate操作
     * @param serie 底盘系列号
     * @param chnr 底盘编号
     * @param operation 操作类型
     * @return 操作结果
     */
    Map<String, Object> processVinPlate(String serie, String chnr, String operation);
}
