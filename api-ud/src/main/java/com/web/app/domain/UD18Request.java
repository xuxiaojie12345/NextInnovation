package com.web.app.domain;

import java.util.List;

/**
 * UD18请求DTO - 用户文档权限管理
 */
 /**

  * UD18Request

  */

public class UD18Request {

/** userid */

    private String userid;
    /** operation */

    private String operation;
    /** doctypes */

    private List<String> doctypes;

    public String getUserid() { return userid; }
    public void setUserid(String userid) { this.userid = userid; }
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    public List<String> getDoctypes() { return doctypes; }
    public void setDoctypes(List<String> doctypes) { this.doctypes = doctypes; }
}
