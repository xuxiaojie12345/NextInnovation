package com.web.app.dto;

/**
 * UD12 Upload&Delete Template API 请求对象
 * 用于接收前端上传、删除、文件列表查询等操作的请求参数
 */
public class UD12UploadDeleteTemplateRequest {

    /** 上传的文件名（uploadFile 时使用） */
    private String templateFile;

    /** 市场代码 */
    private String market;

    public UD12UploadDeleteTemplateRequest() {}

    public UD12UploadDeleteTemplateRequest(String templateFile, String market) {
        this.templateFile = templateFile;
        this.market = market;
    }

    public String getTemplateFile() {
        return templateFile;
    }

    public void setTemplateFile(String templateFile) {
        this.templateFile = templateFile;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }
}
