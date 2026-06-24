package com.web.app.domain;

/**
 * UD12模板文件响应DTO
 * 对应详细设计 4.1 场景2 Response Success
 * 前端期望格式：{ fileName: "template1.rtf", filePath: "/templates/JPN/template1.rtf" }
 */
public class UD12TemplateFileResponse {

    /** 文件名 */
    private String fileName;

    /** 文件路径 */
    private String filePath;

    public UD12TemplateFileResponse() {}

    public UD12TemplateFileResponse(String fileName, String filePath) {
        this.fileName = fileName;
        this.filePath = filePath;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
}
