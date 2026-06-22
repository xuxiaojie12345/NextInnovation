package com.web.app.domain;

/**
 * UD10搜索请求DTO
 * 接收前端传递的搜索条件及运算符（= / !=）
 * 对应全体APIのプロンプト.txt 【UD10HdocvariablesApi】
 */
public class UD10SearchRequest {

    // 字段值
    private String variable;
    private String type;
    private String description;
    private String userid;
    private String registerDatetime;

    // 各字段对应的运算符（= 或 !=），前端传递
    private String variableOp;
    private String typeOp;
    private String descriptionOp;
    private String useridOp;
    private String registerDatetimeOp;

    public UD10SearchRequest() {
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

    public String getVariableOp() {
        return variableOp;
    }

    public void setVariableOp(String variableOp) {
        this.variableOp = variableOp;
    }

    public String getTypeOp() {
        return typeOp;
    }

    public void setTypeOp(String typeOp) {
        this.typeOp = typeOp;
    }

    public String getDescriptionOp() {
        return descriptionOp;
    }

    public void setDescriptionOp(String descriptionOp) {
        this.descriptionOp = descriptionOp;
    }

    public String getUseridOp() {
        return useridOp;
    }

    public void setUseridOp(String useridOp) {
        this.useridOp = useridOp;
    }

    public String getRegisterDatetimeOp() {
        return registerDatetimeOp;
    }

    public void setRegisterDatetimeOp(String registerDatetimeOp) {
        this.registerDatetimeOp = registerDatetimeOp;
    }
}
