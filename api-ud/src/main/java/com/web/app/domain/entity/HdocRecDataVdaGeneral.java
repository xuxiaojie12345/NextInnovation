package com.web.app.domain.entity;

import java.time.LocalDateTime;

/**
 * VDA受信データ(GeneralInformation) Entity
 */
public class HdocRecDataVdaGeneral {
    private String serie;
    private String chnr;
    private String transTs;
    private String vin;
    private String countryOfOperation;
    private String registrationNumber;
    private String deliveryDate;
    private String brandId;
    private String pc;
    private String productType;
    private String companyCode;
    private String marketingType;
    private String mainSpecWeek;
    private String bodySpecWeek;
    private String buildWeek;
    private String usingEndCustomerId;
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

    public String getTransTs() {
        return transTs;
    }

    public void setTransTs(String transTs) {
        this.transTs = transTs;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public String getCountryOfOperation() {
        return countryOfOperation;
    }

    public void setCountryOfOperation(String countryOfOperation) {
        this.countryOfOperation = countryOfOperation;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(String deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public String getBrandId() {
        return brandId;
    }

    public void setBrandId(String brandId) {
        this.brandId = brandId;
    }

    public String getPc() {
        return pc;
    }

    public void setPc(String pc) {
        this.pc = pc;
    }

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public String getCompanyCode() {
        return companyCode;
    }

    public void setCompanyCode(String companyCode) {
        this.companyCode = companyCode;
    }

    public String getMarketingType() {
        return marketingType;
    }

    public void setMarketingType(String marketingType) {
        this.marketingType = marketingType;
    }

    public String getMainSpecWeek() {
        return mainSpecWeek;
    }

    public void setMainSpecWeek(String mainSpecWeek) {
        this.mainSpecWeek = mainSpecWeek;
    }

    public String getBodySpecWeek() {
        return bodySpecWeek;
    }

    public void setBodySpecWeek(String bodySpecWeek) {
        this.bodySpecWeek = bodySpecWeek;
    }

    public String getBuildWeek() {
        return buildWeek;
    }

    public void setBuildWeek(String buildWeek) {
        this.buildWeek = buildWeek;
    }

    public String getUsingEndCustomerId() {
        return usingEndCustomerId;
    }

    public void setUsingEndCustomerId(String usingEndCustomerId) {
        this.usingEndCustomerId = usingEndCustomerId;
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
