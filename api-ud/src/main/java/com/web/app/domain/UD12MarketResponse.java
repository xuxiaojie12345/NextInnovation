package com.web.app.domain;

/**
 * UD12市场响应DTO
 * 对应详细设计 4.1 Response Success
 * 前端期望格式：{ marketCode: "JPN", marketName: "Japan" }
 */
 /**

  * UD12MarketResponse

  */

public class UD12MarketResponse {

    /** 市场代码 */
    private String marketCode;

    /** 市场名称 */
    private String marketName;

    public UD12MarketResponse() {}

    public UD12MarketResponse(String marketCode, String marketName) {
        this.marketCode = marketCode;
        this.marketName = marketName;
    }

    public String getMarketCode() {
        return marketCode;
    }

    public void setMarketCode(String marketCode) {
        this.marketCode = marketCode;
    }

    public String getMarketName() {
        return marketName;
    }

    public void setMarketName(String marketName) {
        this.marketName = marketName;
    }
}
