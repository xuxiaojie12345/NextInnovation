package com.web.app.domain;

/**
 * UD05ModifyDocumentApi 更新请求DTO
 * 对应详细设计：DES-ModifyDocument-001 4.1 更新接口
 * 接收serie、chno、variable、modifiedValue参数
 */
 /**

  * ModifyDocumentUpdateRequest

  */

public class ModifyDocumentUpdateRequest {

    /** 底盘系列号 */
    private String serie;

    /** 底盘编号 */
    private String chno;

    /** 变量名 */
    private String variable;

    /** 修改后的值 */
    private String modifiedValue;

    /** 更新用户ID */
    private String updateUser;

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getChno() {
        return chno;
    }

    public void setChno(String chno) {
        this.chno = chno;
    }

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    public String getModifiedValue() {
        return modifiedValue;
    }

    public void setModifiedValue(String modifiedValue) {
        this.modifiedValue = modifiedValue;
    }

    public String getUpdateUser() {
        return updateUser;
    }

    public void setUpdateUser(String updateUser) {
        this.updateUser = updateUser;
    }
}
