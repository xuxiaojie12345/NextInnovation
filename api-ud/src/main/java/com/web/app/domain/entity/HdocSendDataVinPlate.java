package com.web.app.domain.entity;

import java.time.LocalDateTime;
import java.time.LocalDate;

/**
 * VIN Plate送信データテーブル Entity
 */
public class HdocSendDataVinPlate {
    private String serie;
    private String chnr;
    private String pc;
    private LocalDate added;
    private LocalDate docReady;
    private LocalDate docSent;
    private String bu;
    private Integer status;
    private String xmlDoc;
    private String msg;
    private String type;
    private String isJsDivision;
    private String ordernumber;
    private String filenameOnDisk;
    private String adcaChangeFlg;
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

    public String getPc() {
        return pc;
    }

    public void setPc(String pc) {
        this.pc = pc;
    }

    public LocalDate getAdded() {
        return added;
    }

    public void setAdded(LocalDate added) {
        this.added = added;
    }

    public LocalDate getDocReady() {
        return docReady;
    }

    public void setDocReady(LocalDate docReady) {
        this.docReady = docReady;
    }

    public LocalDate getDocSent() {
        return docSent;
    }

    public void setDocSent(LocalDate docSent) {
        this.docSent = docSent;
    }

    public String getBu() {
        return bu;
    }

    public void setBu(String bu) {
        this.bu = bu;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getXmlDoc() {
        return xmlDoc;
    }

    public void setXmlDoc(String xmlDoc) {
        this.xmlDoc = xmlDoc;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIsJsDivision() {
        return isJsDivision;
    }

    public void setIsJsDivision(String isJsDivision) {
        this.isJsDivision = isJsDivision;
    }

    public String getOrdernumber() {
        return ordernumber;
    }

    public void setOrdernumber(String ordernumber) {
        this.ordernumber = ordernumber;
    }

    public String getFilenameOnDisk() {
        return filenameOnDisk;
    }

    public void setFilenameOnDisk(String filenameOnDisk) {
        this.filenameOnDisk = filenameOnDisk;
    }

    public String getAdcaChangeFlg() {
        return adcaChangeFlg;
    }

    public void setAdcaChangeFlg(String adcaChangeFlg) {
        this.adcaChangeFlg = adcaChangeFlg;
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
