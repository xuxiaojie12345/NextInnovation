package com.web.app.domain;

/**
 * UD08搜索请求DTO
 * 接收前端传递的搜索条件及运算符（= / !=）
 */
public class UD08SearchRequest {

    // 字段值
    private String productClass;
    private String number;
    private String market;
    private String variable;
    private String value;
    private String vs;
    private String vs2;
    private String comments;
    private String addDate;
    private String deleteDate;
    private String updateUser;
    private String updateDatetime;

    // 各字段对应的运算符（= 或 !=），前端传递
    private String productClassOp;
    private String numberOp;
    private String marketOp;
    private String variableOp;
    private String valueOp;
    private String vsOp;
    private String vs2Op;
    private String commentsOp;
    private String addDateOp;
    private String deleteDateOp;
    private String updateUserOp;
    private String updateDatetimeOp;

    public UD08SearchRequest() {
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

    // === 运算符 Getter/Setter ===

    public String getProductClassOp() {
        return productClassOp;
    }

    public void setProductClassOp(String productClassOp) {
        this.productClassOp = productClassOp;
    }

    public String getNumberOp() {
        return numberOp;
    }

    public void setNumberOp(String numberOp) {
        this.numberOp = numberOp;
    }

    public String getMarketOp() {
        return marketOp;
    }

    public void setMarketOp(String marketOp) {
        this.marketOp = marketOp;
    }

    public String getVariableOp() {
        return variableOp;
    }

    public void setVariableOp(String variableOp) {
        this.variableOp = variableOp;
    }

    public String getValueOp() {
        return valueOp;
    }

    public void setValueOp(String valueOp) {
        this.valueOp = valueOp;
    }

    public String getVsOp() {
        return vsOp;
    }

    public void setVsOp(String vsOp) {
        this.vsOp = vsOp;
    }

    public String getVs2Op() {
        return vs2Op;
    }

    public void setVs2Op(String vs2Op) {
        this.vs2Op = vs2Op;
    }

    public String getCommentsOp() {
        return commentsOp;
    }

    public void setCommentsOp(String commentsOp) {
        this.commentsOp = commentsOp;
    }

    public String getAddDateOp() {
        return addDateOp;
    }

    public void setAddDateOp(String addDateOp) {
        this.addDateOp = addDateOp;
    }

    public String getDeleteDateOp() {
        return deleteDateOp;
    }

    public void setDeleteDateOp(String deleteDateOp) {
        this.deleteDateOp = deleteDateOp;
    }

    public String getUpdateUserOp() {
        return updateUserOp;
    }

    public void setUpdateUserOp(String updateUserOp) {
        this.updateUserOp = updateUserOp;
    }

    public String getUpdateDatetimeOp() {
        return updateDatetimeOp;
    }

    public void setUpdateDatetimeOp(String updateDatetimeOp) {
        this.updateDatetimeOp = updateDatetimeOp;
    }
}
