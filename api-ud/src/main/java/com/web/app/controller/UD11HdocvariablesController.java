package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD11HdocvariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD11_Hdocvariables 控制器
 * 提供HDOC Variables的搜索查询功能
 */
@RestController
@RequestMapping("/api/ud11hdocvariables")
@Api(tags = "UD11-HDOC变量查询")
public class UD11HdocvariablesController {

    private static final Logger logger = LogManager.getLogger(UD11HdocvariablesController.class);

    @Autowired
    private UD11HdocvariablesService ud11HdocvariablesService;

    /**
     * 搜索HDOC Variables
     *
     * @param variable    变量名
     * @param type        类型
     * @param description 描述
     * @return 统一响应对象，包含变量列表
     */
    @GetMapping("/search")
    @ApiOperation(value = "搜索HDOC Variables", notes = "根据查询条件检索HDOC_VARIABLES表中的变量记录")
    public ApiResponse<Map<String, Object>> search(
            @RequestParam(required = false) String variable,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String description) {

        logger.info("接收到搜索HDOC Variables请求");

        try {
            Map<String, Object> params = new HashMap<>();
            params.put("variable", variable);
            params.put("type", type);
            params.put("description", description);

            List<Map<String, Object>> variables = ud11HdocvariablesService.search(params);

            Map<String, Object> data = new HashMap<>();
            data.put("variables", variables);
            data.put("count", variables.size());

            logger.info("HDOC Variables搜索完成，共{}条记录", variables.size());
            return ApiResponse.success("查询成功", data);
        } catch (Exception e) {
            logger.error("搜索HDOC Variables失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
