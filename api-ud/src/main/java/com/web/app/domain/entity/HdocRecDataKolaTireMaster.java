package com.web.app.domain.entity;

import java.time.LocalDateTime;

/**
 * KOLA受信データ(tire master) Entity
 */
public class HdocRecDataKolaTireMaster {
    private String partno;
    private String tdim;
    private String brand;
    private String loadIndex;
    private String vpv;
    private String transTs;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;

    public String getPartno() {
        return partno;
    }

    public void setPartno(String partno) {
        this.partno = partno;
    }

    public String getTdim() {
        return tdim;
    }

    public void setTdim(String tdim) {
        this.tdim = tdim;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getLoadIndex() {
        return loadIndex;
    }

    public void setLoadIndex(String loadIndex) {
        this.loadIndex = loadIndex;
    }

    public String getVpv() {
        return vpv;
    }

    public void setVpv(String vpv) {
        this.vpv = vpv;
    }

    public String getTransTs() {
        return transTs;
    }

    public void setTransTs(String transTs) {
        this.transTs = transTs;
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
