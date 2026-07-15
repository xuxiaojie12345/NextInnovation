package com.web.app.domain.entity;


/**
 * MARKET_MASTER表对应的实体类
 */
public class MarketMaster extends BaseEntity {

    private String market;
    private String description;

    public MarketMaster() {
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
