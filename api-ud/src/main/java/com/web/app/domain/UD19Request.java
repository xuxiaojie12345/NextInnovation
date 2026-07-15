package com.web.app.domain;

/**
 * UD19请求DTO - 多条件用户搜索
 */
 /**

  * UD19Request

  */

public class UD19Request {

/** operation */

    private String operation;
    /** userid */

    private String userid;
    /** user */

    private String user;
    /** market */

    private String market;
    /** type */

    private String type;

    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    public String getUserid() { return userid; }
    public void setUserid(String userid) { this.userid = userid; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
