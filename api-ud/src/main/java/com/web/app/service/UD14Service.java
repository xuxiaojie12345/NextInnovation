package com.web.app.service;

import java.util.Map;

/**
 * UD14SearchresultistApi 服务接口
 * 对应全体APIのプロンプト.txt 【UD14SearchresultistApi】
 *
 * 功能：模板文件列表与使用状态查询
 */
public interface UD14Service {

    /**
     * UD14SelectMarketmaster - 从MARKET_MASTER表无条件检索所有市场信息
     * @return { markets: [{market: "AUT"}], totalCount: N }
     */
    Map<String, Object> selectMarketMaster();

    /**
     * UD14SelectHdocuserdefinedrules - 模板文件列表及使用状态查询
     * @param market 市场代码
     * @return { files: [{filename, used, lastModified, size, downloadUrl}], totalCount: N }
     */
    Map<String, Object> selectHdocUserDefinedRules(String market);
}
