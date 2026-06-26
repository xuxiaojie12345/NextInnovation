package com.web.app.service;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;

/**
 * UD14 搜索结果列表服务接口
 *
 * 功能说明：定义市场列表和变量搜索的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD14SearchresultistService {

    /**
     * 获取市场列表
     *
     * @return 响应对象
     */
    UD14SearchresultistResponse selectMarketMaster();

    /**
     * 根据市场获取用户定义规则变量列表
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD14SearchresultistResponse selectUserDefinedRules(UD14SearchresultistRequest request);

    /**
     * 获取指定Market文件夹下的文件列表
     * 读取market文件夹下的文件，并检查每个文件是否在HDOC_USER_DEFINED_RULES中已使用
     *
     * @param request 请求对象（包含market）
     * @return 响应对象（包含文件列表）
     */
    UD14SearchresultistResponse getMarketFiles(UD14SearchresultistRequest request);
}
