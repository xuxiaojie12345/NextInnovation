package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocSendDataVinPlate;

/**
 * UD15 Service
 * 提供VIN Plate信息的查看、重新生成、设置OK、
 * 切换到基础信息、切换到高级信息业务逻辑
 */
public interface UD15Service {

    /**
     * 查看VIN Plate信息
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    ApiResponse<?> viewInfo(HdocSendDataVinPlate request);

    /**
     * 设置重新生成（STATUS='0'）
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    ApiResponse<?> setRegenerate(HdocSendDataVinPlate request);

    /**
     * 设置OK（STATUS='1'）
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    ApiResponse<?> setOk(HdocSendDataVinPlate request);

    /**
     * 切换到基础信息（STATUS='0', TYPE='1'）
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    ApiResponse<?> changeToBasicInfo(HdocSendDataVinPlate request);

    /**
     * 切换到高级信息（STATUS='0', TYPE='2'）
     *
     * @param request 请求参数（chassisNumber）
     * @return API响应
     */
    ApiResponse<?> changeToAdvancedInfo(HdocSendDataVinPlate request);
}
