package com.web.app.dto;

import java.util.List;

import lombok.Data;

/**
 * Market 列表响应数据体
 * 对应设计书 3.1.1：初期表示时请求 API 加载 Market 列表
 */
@Data
public class MarketListResponse {

    /** Market 代码列表（来源：MARKET_MASTER 表） */
    private List<String> markets;
}
