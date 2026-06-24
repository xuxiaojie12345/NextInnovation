package com.web.app.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 业务异常类
 * 
 * @description 用于处理业务逻辑中的异常情况
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BusinessException extends RuntimeException {

    /**
     * 错误码
     */
    private String errorCode;

    /**
     * 错误消息
     */
    private String errorMessage;

    /**
     * 构造器
     * 
     * @param errorCode    错误码
     * @param errorMessage 错误消息
     */
    public BusinessException(String errorCode, String errorMessage) {
        super(errorMessage);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }

    /**
     * 构造器（仅错误消息）
     * 
     * @param errorMessage 错误消息
     */
    public BusinessException(String errorMessage) {
        super(errorMessage);
        this.errorCode = "BUSINESS_ERROR";
        this.errorMessage = errorMessage;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

}
