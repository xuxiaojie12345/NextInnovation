package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

/**
 * Controller 基类
 *
 * 提供所有 Controller 共用的 Logger 和通用错误处理方法，
 * 避免在各个 Controller 中重复声明和编写 try-catch 样板代码。
 */
public abstract class BaseController {

    /** 共用日志记录器 */
    protected static final Logger logger = LoggerFactory.getLogger(BaseController.class);

    /**
     * 处理 ApiResponse 类型的异常，记录日志后返回 serverError
     *
     * @param operation 操作名称（用于日志）
     * @param e         异常对象
     * @param <T>       响应数据类型
     * @return ApiResponse serverError
     */
    protected static <T> ApiResponse<T> handleError(String operation, Exception e) {
        logger.error("{} error", operation, e);
        return ApiResponse.serverError();
    }

    /**
     * 处理 ResponseEntity 类型的异常，记录日志后返回 500
     *
     * @param operation 操作名称（用于日志）
     * @param e         异常对象
     * @param <T>       响应数据类型
     * @return ResponseEntity 500
     */
    protected static <T> ResponseEntity<T> handleResponseEntityError(String operation, Exception e) {
        logger.error("{} error", operation, e);
        return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }
}
