package com.web.app.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 生成文档查询响应DTO
 */
public class GenerateDocumentQueryResponse {
    
    private String chassisNo;              // Chassis no (CHNR)
    private String serie;                  // Chassis series (SERIE)
    private String ordernumber;            // Ordernumber
    private String buildWeek;              // Build week
    private String specWeek;               // Spec week
    private String market;                 // Market (CountryOfOperation)
    private String masterMarket;           // Master Market (固定为'-EU')
    private String sNoteNo;                // S-Note NO
    private String sNoteMessage;           // S-Note Message
    private String loadIndex;              // Load Index
    private String analyzeRules;           // Analyze Rules
    private String modifyDocLink;          // Modify Doc Link
    private String usingTemplate;          // Using template
    private String replacingParameters;    // Replacing parameters
    private String generatedDocument;      // Generated document
    private String date;                   // Date
    private String hdocVersion;            // HDoc version

    // 默认构造函数
    public GenerateDocumentQueryResponse() {
        this.masterMarket = "-EU";  // 固定值
    }

    // Getter和Setter方法
    public String getChassisNo() {
        return chassisNo;
    }

    public void setChassisNo(String chassisNo) {
        this.chassisNo = chassisNo;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getOrdernumber() {
        return ordernumber;
    }

    public void setOrdernumber(String ordernumber) {
        this.ordernumber = ordernumber;
    }

    public String getBuildWeek() {
        return buildWeek;
    }

    public void setBuildWeek(String buildWeek) {
        this.buildWeek = buildWeek;
    }

    public String getSpecWeek() {
        return specWeek;
    }

    public void setSpecWeek(String specWeek) {
        this.specWeek = specWeek;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getMasterMarket() {
        return masterMarket;
    }

    public void setMasterMarket(String masterMarket) {
        this.masterMarket = masterMarket;
    }

    @JsonProperty("sNoteNo")
    public String getSNoteNo() {
        return sNoteNo;
    }

    public void setSNoteNo(String sNoteNo) {
        this.sNoteNo = sNoteNo;
    }

    @JsonProperty("sNoteMessage")
    public String getSNoteMessage() {
        return sNoteMessage;
    }

    public void setSNoteMessage(String sNoteMessage) {
        this.sNoteMessage = sNoteMessage;
    }

    public String getLoadIndex() {
        return loadIndex;
    }

    public void setLoadIndex(String loadIndex) {
        this.loadIndex = loadIndex;
    }

    public String getAnalyzeRules() {
        return analyzeRules;
    }

    public void setAnalyzeRules(String analyzeRules) {
        this.analyzeRules = analyzeRules;
    }

    public String getModifyDocLink() {
        return modifyDocLink;
    }

    public void setModifyDocLink(String modifyDocLink) {
        this.modifyDocLink = modifyDocLink;
    }

    public String getUsingTemplate() {
        return usingTemplate;
    }

    public void setUsingTemplate(String usingTemplate) {
        this.usingTemplate = usingTemplate;
    }

    public String getReplacingParameters() {
        return replacingParameters;
    }

    public void setReplacingParameters(String replacingParameters) {
        this.replacingParameters = replacingParameters;
    }

    public String getGeneratedDocument() {
        return generatedDocument;
    }

    public void setGeneratedDocument(String generatedDocument) {
        this.generatedDocument = generatedDocument;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getHdocVersion() {
        return hdocVersion;
    }

    public void setHdocVersion(String hdocVersion) {
        this.hdocVersion = hdocVersion;
    }
}