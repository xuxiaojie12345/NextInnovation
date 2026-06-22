package com.web.app.service;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;

/**
 * UD15 - VIN Plate操作服务接口
 */
public interface UD15SelecthdocsenddatavinplateService {

    /**
     * 查看VIN Plate信息
     */
    UD15SelecthdocsenddatavinplateResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 设置重新生成
     */
    UD15SelecthdocsenddatavinplateResponse setRegenerate(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 设置OK
     */
    UD15SelecthdocsenddatavinplateResponse setOk(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 切换为基本信息
     */
    UD15SelecthdocsenddatavinplateResponse changeToBasicInfo(UD15SelecthdocsenddatavinplateRequest request);

    /**
     * 切换为高级信息
     */
    UD15SelecthdocsenddatavinplateResponse changeToAdvancedInfo(UD15SelecthdocsenddatavinplateRequest request);
}
