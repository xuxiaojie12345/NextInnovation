package com.web.app.domain.entity;

import java.time.LocalDateTime;

/**
 * KAP受信データ(SNOTE) Entity
 */
public class HdocRecDataKapSnote {
    private String snote;
    private String variantId;
    private String transTs;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;

    public String getSnote() {
        return snote;
    }

    public void setSnote(String snote) {
        this.snote = snote;
    }

    public String getVariantId() {
        return variantId;
    }

    public void setVariantId(String variantId) {
        this.variantId = variantId;
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
