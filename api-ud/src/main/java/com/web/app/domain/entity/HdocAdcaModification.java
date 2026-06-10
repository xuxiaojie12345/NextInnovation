package com.web.app.domain.entity;

import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * ADCA Change対象項目テーブル Entity
 */
public class HdocAdcaModification {
    private String serie;
    private String chno;
    private String doctype;
    private String lang;
    private String variable;
    private BigDecimal vers;
    private String newval;
    private BigDecimal sta;
    private String bu;
    private String releaseUser;
    private LocalDateTime releaseDateTime;
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

    public String getChno() {
        return chno;
    }

    public void setChno(String chno) {
        this.chno = chno;
    }

    public String getDoctype() {
        return doctype;
    }

    public void setDoctype(String doctype) {
        this.doctype = doctype;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    public BigDecimal getVers() {
        return vers;
    }

    public void setVers(BigDecimal vers) {
        this.vers = vers;
    }

    public String getNewval() {
        return newval;
    }

    public void setNewval(String newval) {
        this.newval = newval;
    }

    public BigDecimal getSta() {
        return sta;
    }

    public void setSta(BigDecimal sta) {
        this.sta = sta;
    }

    public String getBu() {
        return bu;
    }

    public void setBu(String bu) {
        this.bu = bu;
    }

    public String getReleaseUser() {
        return releaseUser;
    }

    public void setReleaseUser(String releaseUser) {
        this.releaseUser = releaseUser;
    }

    public LocalDateTime getReleaseDateTime() {
        return releaseDateTime;
    }

    public void setReleaseDateTime(LocalDateTime releaseDateTime) {
        this.releaseDateTime = releaseDateTime;
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
