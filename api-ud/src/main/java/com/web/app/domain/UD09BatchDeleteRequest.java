package com.web.app.domain;

/**
 * UD09批量删除请求DTO
 * 包含待删除记录的主键列表
 */
 /**

  * UD09BatchDeleteRequest

  */

public class UD09BatchDeleteRequest {

/** productClass */

    private String productClass;
    /** number */

    private String number;
    /** market */

    private String market;

    public UD09BatchDeleteRequest() {
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
