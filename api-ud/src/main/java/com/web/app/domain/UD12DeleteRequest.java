package com.web.app.domain;

/**
 * UD12文件删除请求DTO
 * 对应详细设计 4.3 Request
 */
 /**

  * UD12DeleteRequest

  */

public class UD12DeleteRequest {

    /** 市场代码 */
    private String market;

    /** 要删除的文件名 */
    private String fileName;

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}
