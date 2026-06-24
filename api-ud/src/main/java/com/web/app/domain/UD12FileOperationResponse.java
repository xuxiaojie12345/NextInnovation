package com.web.app.domain;

/**
 * UD12文件操作响应DTO
 * 对应详细设计 4.2 / 4.3 Response Success
 * 前端期望格式：{ fileName: "template1.rtf", market: "JPN" }
 */
public class UD12FileOperationResponse {

    /** 文件名 */
    private String fileName;

    /** 市场代码 */
    private String market;

    public UD12FileOperationResponse() {}

    public UD12FileOperationResponse(String fileName, String market) {
        this.fileName = fileName;
        this.market = market;
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
}
