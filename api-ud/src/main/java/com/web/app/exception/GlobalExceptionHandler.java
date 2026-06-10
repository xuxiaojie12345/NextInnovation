package com.web.app.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleException(Exception e) {
        logger.error("系统异常", e);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 500);
        result.put("msg", "系统内部错误：" + e.getMessage());
        result.put("data", null);
        return result;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public Map<String, Object> handleIllegalArgumentException(IllegalArgumentException e) {
        logger.warn("参数异常", e);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 400);
        result.put("msg", e.getMessage());
        result.put("data", null);
        return result;
    }
}
