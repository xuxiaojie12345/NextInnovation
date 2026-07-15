package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD15Request;
import com.web.app.service.UD15Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD15控制器 - UD15SelecthdocsenddatavinplateApi
 * POST /api/ud15/UD15SelecthdocsenddatavinplateApi
 */
@RestController
@RequestMapping("/api/ud15")
/**

 * UD15Controller

 */

public class UD15Controller extends BaseController {@Autowired
    /** ud15Service */

    private UD15Service ud15Service;

    @PostMapping("/UD15SelecthdocsenddatavinplateApi")
    /**

     * processVinPlate

     */

    public ApiResponse<Map<String, Object>> processVinPlate(@RequestBody UD15Request request) {
        logger.info("UD15SelecthdocsenddatavinplateApi called - operation: {}, chassis: {}",
                request.getOperation(), request.getChassisNumber());

        if (request.getChassisNumber() == null || request.getChassisNumber().trim().isEmpty()) {
            return ApiResponse.error(400, "Chassis number is required.");
        }
        if (request.getOperation() == null || request.getOperation().trim().isEmpty()) {
            return ApiResponse.error(400, "Operation is required.");
        }

        try {
            // 解析 chassisNumber: "serie-chnr"（使用中划线分隔）
            String chassisNumber = request.getChassisNumber().trim();
            String[] parts = chassisNumber.split("-", 2);
            String serie = parts[0];
            String chnr = parts.length > 1 ? parts[1] : "";

            String operation = request.getOperation().trim();
            String updateUser = request.getUpdateUser() != null ? request.getUpdateUser().trim() : "";
            Map<String, Object> result = ud15Service.processVinPlate(serie, chnr, operation, updateUser);

            // 对于viewInfo,直接返回数据; 对于更新操作,将message放到外层
            if ("viewInfo".equals(operation)) {
                return ApiResponse.success(result);
            } else {
                String msg = (String) result.getOrDefault("message", "Operation successful.");
                return new ApiResponse<>(200, msg, null);
            }
        } catch (IllegalArgumentException e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("not found")) {
                return ApiResponse.notFound(msg);
            }
            return ApiResponse.error(400, msg);
        } catch (Exception e) {
            logger.error("UD15SelecthdocsenddatavinplateApi error", e);
            return ApiResponse.serverError();
        }
    }
}
