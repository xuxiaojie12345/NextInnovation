package com.web.app.service;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;

/**
 * UD15 VIN Plate数据服务接口
 *
 * 功能说明：定义VIN Plate信息查询、状态更新的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD15SelecthdocsenddatavinplateService {

    /**
     * 查看VIN Plate信息
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD15SelecthdocsenddatavinplateResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 设置重新生成状态
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD15SelecthdocsenddatavinplateResponse setRegenerate(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 设置OK状态
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD15SelecthdocsenddatavinplateResponse setOK(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 切换为基础信息
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD15SelecthdocsenddatavinplateResponse changeToBasicInfo(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 切换为高级信息
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD15SelecthdocsenddatavinplateResponse changeToAdvancedInfo(UD15SelecthdocsenddatavinplateRequest request);
}
