package com.web.app.dto;

/**
 * 上传删除模板请求DTO
 */
public class UploadDeleteTemplateRequest {

    private String templateFile; // Base64编码的文件内容
    private String fileName;     // 文件名
    private String market;
    private String templateName;

    public String getTemplateFile() {
        return templateFile;
    }

    public void setTemplateFile(String templateFile) {
        this.templateFile = templateFile;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }
}
