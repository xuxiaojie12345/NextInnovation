package com.web.app.domain.entity;

import java.time.LocalDateTime;

/**
 * ADCA Changeテーブル Entity
 */
public class HdocAdcaChange {
    private String serie;
    private String chnr;
    private String act;
    private String bu;
    private String reason;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getChnr() {
        return chnr;
    }

    public void setChnr(String chnr) {
        this.chnr = chnr;
    }

    public String getAct() {
        return act;
    }

    public void setAct(String act) {
        this.act = act;
    }

    public String getBu() {
        return bu;
    }

    public void setBu(String bu) {
        this.bu = bu;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getRegisterDatetime() {
        return registerDatetime;
    }

    public void setRegisterDatetime(LocalDateTime registerDatetime) {
        this.registerDatetime = registerDatetime;
    }

    public String getRegisterUser() {
        return registerUser;
    }

    public void setRegisterUser(String registerUser) {
        this.registerUser = registerUser;
    }

    public String getRegisterProcess() {
        return registerProcess;
    }

    public void setRegisterProcess(String registerProcess) {
        this.registerProcess = registerProcess;
    }

    public LocalDateTime getUpdateDatetime() {
        return updateDatetime;
    }

    public void setUpdateDatetime(LocalDateTime updateDatetime) {
        this.updateDatetime = updateDatetime;
    }

    public String getUpdateUser() {
        return updateUser;
    }

    public void setUpdateUser(String updateUser) {
        this.updateUser = updateUser;
    }

    public String getUpdateProcess() {
        return updateProcess;
    }

    public void setUpdateProcess(String updateProcess) {
        this.updateProcess = updateProcess;
    }
}
