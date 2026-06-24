package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD16Request;
import com.web.app.service.UD16Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD16控制器 - UD16ADChangeApi
 * POST /api/adchange/process
 */
@RestController
@RequestMapping("/api")
public class UD16Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD16Controller.class);

    @Autowired
    private UD16Service ud16Service;

    @PostMapping("/adchange/process")
    public ApiResponse<Map<String, Object>> processAdChange(@RequestBody UD16Request request) {
        logger.info("UD16ADChangeApi called - operation: {}, serieChnr: {}", request.getOperation(), request.getSerieChnr());

        if (request.getOperation() == null || request.getOperation().trim().isEmpty()) {
            return ApiResponse.error(400, "Operation is required.");
        }

        try {
            Map<String, Object> result = ud16Service.processAdChange(request);
            String op = request.getOperation().trim();

            if ("CHECK".equals(op)) {
                // CHECK: 记录不存在时返回"数据不存在"
                Boolean found = (Boolean) result.get("found");
                if (found != null && !found) {
                    return new ApiResponse<>(200, "数据不存在", null);
                }
                // 记录存在时返回数据
                return new ApiResponse<>(200, "success", result);
            } else if ("ADD".equals(op)) {
                return new ApiResponse<>(200, "添加成功", null);
            } else if ("DELETE".equals(op)) {
                return new ApiResponse<>(200, "删除成功", null);
            }
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            String msg = e.getMessage();
            if ("该Serie-Chnr已存在".equals(msg)) {
                // 返回409冲突
                return new ApiResponse<>(409, msg, null);
            }
            return ApiResponse.error(400, msg);
        } catch (Exception e) {
            logger.error("UD16ADChangeApi error", e);
            // 返回具体错误信息便于排查
            return new ApiResponse<>(500, "操作失败: " + e.getMessage(), null);
        }
    }
}
