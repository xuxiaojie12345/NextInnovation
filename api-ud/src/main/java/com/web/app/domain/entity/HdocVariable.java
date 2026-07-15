package com.web.app.domain.entity;


/**
 * HDOC_VARIABLES表对应的实体类
 */
 /**

  * HdocVariable

  */

public class HdocVariable extends BaseEntity {

/** variable */

    private String variable;
    /** type */

    private String type;
    /** description */

    private String description;
    /** userid */

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
