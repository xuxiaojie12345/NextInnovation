package com.web.app.domain;

/**
 * UD08删除请求DTO
 * 仅需主键三个字段：productClass、number、market
 */
public class UD08DeleteRequest {

    private String productClass;
    private String number;
    private String market;

    public UD08DeleteRequest() {
    }

    public String getProductClass() {
        return productClass;
    }

    public void setProductClass(String productClass) {
        this.productClass = productClass;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }
}
