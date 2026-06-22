package com.web.app.domain;

/**
 * UD10添加/更新请求DTO
 * 接收前端表单所有字段（字段名为前端formData中的key）
 * 对应全体APIのプロンプト.txt 【UD10HdocvariablesApi】
 */
public class UD10Request {

    private String variable;
    private String type;
    private String description;
    private String userid;
    private String registerDatetime;

    public UD10Request() {
    }

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUserid() {
        return userid;
    }

    public void setUserid(String userid) {
        this.userid = userid;
    }

    public String getRegisterDatetime() {
        return registerDatetime;
    }

    public void setRegisterDatetime(String registerDatetime) {
        this.registerDatetime = registerDatetime;
    }
}
