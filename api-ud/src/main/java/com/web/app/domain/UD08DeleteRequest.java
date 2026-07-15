package com.web.app.domain;

/**
 * UD08删除请求DTO
 * 仅需主键三个字段：productClass、number、market
 */
 /**

  * UD08DeleteRequest

  */

public class UD08DeleteRequest {

/** productClass */

    private String productClass;
    /** number */

    private String number;
    /** market */

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
