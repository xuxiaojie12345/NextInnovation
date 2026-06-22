package com.web.app.domain;

/**
 * 生成文档查询请求DTO
 * 对应详细设计 UD04 - 4.1 UD04SelectGeneratedocumentApi
 * 请求参数包含 chassisSeries、chassisNo 和 documentType
 */
public class GenerateDocumentQueryRequest {
    
    private String chassisSeries;
    private String chassisNo;
    private String documentType;

    // 默认构造函数
    public GenerateDocumentQueryRequest() {
    }

    // Getter和Setter方法
    public String getChassisSeries() {
        return chassisSeries;
    }

    public void setChassisSeries(String chassisSeries) {
        this.chassisSeries = chassisSeries;
    }

    public String getChassisNo() {
        return chassisNo;
    }

    public void setChassisNo(String chassisNo) {
        this.chassisNo = chassisNo;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }
}