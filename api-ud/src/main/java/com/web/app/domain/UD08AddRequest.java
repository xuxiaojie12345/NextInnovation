package com.web.app.domain;

/**
 * UD08添加请求DTO
 * 接收前端表单所有字段
 */
 /**

  * UD08AddRequest

  */

public class UD08AddRequest {

/** productClass */

    private String productClass;
    /** number */

    private String number;
    /** market */

    private String market;
    /** variable */

    private String variable;
    /** value */

    private String value;
    /** vs */

    private String vs;
    /** vs2 */

    private String vs2;
    /** comments */

    private String comments;
    /** addDate */

    private String addDate;
    /** deleteDate */

    private String deleteDate;
    /** updateUser */

    private String updateUser;
    /** updateDatetime */

    private String updateDatetime;

    public UD08AddRequest() {
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

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
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

    public String getUpdateUser() {
        return updateUser;
    }

    public void setUpdateUser(String updateUser) {
        this.updateUser = updateUser;
    }

    public String getUpdateDatetime() {
        return updateDatetime;
    }

    public void setUpdateDatetime(String updateDatetime) {
        this.updateDatetime = updateDatetime;
    }
}
