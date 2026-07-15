package com.web.app.domain.entity;


/**
 * HDOC_VARIABLES表对应的实体类
 */
public class HdocVariable extends BaseEntity {

    private String variable;
    private String type;
    private String description;
    private String userid;

    public HdocVariable() {
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
}
