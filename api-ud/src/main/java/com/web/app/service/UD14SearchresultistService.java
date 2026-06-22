package com.web.app.service;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;

/**
 * UD14 - 搜索结果列表服务接口
 */
public interface UD14SearchresultistService {

    /**
     * 查询市场主数据（初期表示）
     */
    UD14SearchresultistResponse selectMarketmaster();

    /**
     * 根据市场查询用户定义规则
     */
    UD14SearchresultistResponse selectHdocuserdefinedrules(UD14SearchresultistRequest request);
}
