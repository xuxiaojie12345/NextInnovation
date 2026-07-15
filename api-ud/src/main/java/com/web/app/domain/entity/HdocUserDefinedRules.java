package com.web.app.domain.entity;

import java.math.BigDecimal;

/**
 * HDOC_USER_DEFINED_RULES表对应的实体类
 */
 /**

  * HdocUserDefinedRules

  */

public class HdocUserDefinedRules extends BaseEntity {

/** pc */

    private String pc;
    /** num */

    private BigDecimal num;
    /** market */

    private String market;
    /** vs */

    private String vs;
    /** vs2 */

    private String vs2;
    /** variable */

    private String variable;
    /** val */

    private String val;
    /** userid */

    private String userid;
    /** upDate */

    private String upDate;
    /** comments */

    private String comments;
    /** addDate */

    private String addDate;
    /** deleteDate */

    private String deleteDate;

    public HdocUserDefinedRules() {
    }

    public String getPc() {
        return pc;
    }

    public void setPc(String pc) {
        this.pc = pc;
    }

    public BigDecimal getNum() {
        return num;
    }

    public void setNum(BigDecimal num) {
        this.num = num;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getVs() {
        return vs;
    }

    public void setVs(String vs) {
        this.vs = vs;
    }

    public String getVs2() {
        return vs2;
    }

    public void setVs2(String vs2) {
        this.vs2 = vs2;
    }

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    public String getVal() {
        return val;
    }

    public void setVal(String val) {
        this.val = val;
    }

    public String getUserid() {
        return userid;
    }

    public void setUserid(String userid) {
        this.userid = userid;
    }

    public String getUpDate() {
        return upDate;
    }

    public void setUpDate(String upDate) {
        this.upDate = upDate;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getAddDate() {
        return addDate;
    }

    public void setAddDate(String addDate) {
        this.addDate = addDate;
    }

    public String getDeleteDate() {
        return deleteDate;
    }

    public void setDeleteDate(String deleteDate) {
        this.deleteDate = deleteDate;
    }
}
