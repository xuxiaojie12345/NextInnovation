package com.web.app.domain;

/**
 * UD09批量删除响应DTO
 */
public class UD09BatchDeleteResponse {

    private int deletedCount;
    private int failedCount;
    private String message;

    public UD09BatchDeleteResponse() {
    }

    public UD09BatchDeleteResponse(int deletedCount, int failedCount, String message) {
        this.deletedCount = deletedCount;
        this.failedCount = failedCount;
        this.message = message;
    }

    public int getDeletedCount() {
        return deletedCount;
    }

    public void setDeletedCount(int deletedCount) {
        this.deletedCount = deletedCount;
    }

    public int getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(int failedCount) {
        this.failedCount = failedCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
