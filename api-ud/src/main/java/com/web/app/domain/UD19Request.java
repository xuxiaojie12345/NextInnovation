package com.web.app.domain;

/**
 * UD19请求DTO - 多条件用户搜索
 */
public class UD19Request {

    private String operation;
    private String userid;
    private String user;
    private String market;
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
