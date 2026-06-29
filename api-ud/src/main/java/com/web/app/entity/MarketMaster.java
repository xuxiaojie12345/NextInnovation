package com.web.app.entity;

/**
 * MARKET_MASTER 实体类
 * 市场（Market）主表
 */
public class MarketMaster {

    /** 市场代码（如 JPN, CHN, USD） */
    private String market;

    public MarketMaster() {}

    public MarketMaster(String market) {
        this.market = market;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }
}
