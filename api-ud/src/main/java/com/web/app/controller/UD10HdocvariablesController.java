package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD10HdocvariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD10_Hdocvariables 控制器
 * 提供HDOC Variables的新增/更新/删除/查询操作
 */
@RestController
@RequestMapping("/api/ud10hdocvariables")
@Api(tags = "UD10-HDOC变量管理")
public class UD10HdocvariablesController {

    private static final Logger logger = LogManager.getLogger(UD10HdocvariablesController.class);

    @Autowired
    private UD10HdocvariablesService ud10HdocvariablesService;

    /**
     * 新增HDOC Variable
     *
     * @param params 请求参数（包含variable, type, description等）
     * @return 统一响应对象
     */
    @PostMapping("/add")
    @ApiOperation(value = "新增HDOC Variable", notes = "向HDOC_VARIABLES表插入一条新记录")
    public ApiResponse<Void> add(@RequestBody Map<String, Object> params) {

        logger.info("接收到新增HDOC Variable请求");

        try {
            String variable = (String) params.get("variable");
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error("Variable is required");
            }
            if (variable.length() > 30) {
                return ApiResponse.error("Variable length exceeds 30 characters");
            }

            // 检查是否已存在
            if (ud10HdocvariablesService.checkVariableExists(variable.trim())) {
                return ApiResponse.error(400, "Variable already exists. Please enter the correct content");
            }

            ud10HdocvariablesService.add(params);

            logger.info("新增HDOC Variable成功");
            return ApiResponse.success("Success");
        } catch (Exception e) {
            logger.error("新增HDOC Variable失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新HDOC Variable
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/update")
    @ApiOperation(value = "更新HDOC Variable", notes = "更新HDOC_VARIABLES表中的记录")
    public ApiResponse<Void> update(@RequestBody Map<String, Object> params) {

        logger.info("接收到更新HDOC Variable请求");

        try {
            String variable = (String) params.get("variable");
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error("Variable is required");
            }

            // 检查是否存在
            if (!ud10HdocvariablesService.checkVariableExists(variable.trim())) {
                return ApiResponse.error(400, "Variable does not exists. Please enter the correct content");
            }

            ud10HdocvariablesService.update(params);

            logger.info("更新HDOC Variable成功");
            return ApiResponse.success("Success");
        } catch (Exception e) {
            logger.error("更新HDOC Variable失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除HDOC Variable
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/delete")
    @ApiOperation(value = "删除HDOC Variable", notes = "根据Variable删除HDOC_VARIABLES表中的记录")
    public ApiResponse<Void> delete(@RequestBody Map<String, Object> params) {

        logger.info("接收到删除HDOC Variable请求");

        try {
            String variable = (String) params.get("variable");
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error("Variable is required");
            }

            // 检查是否存在
            if (!ud10HdocvariablesService.checkVariableExists(variable.trim())) {
                return ApiResponse.error(400, "Variable does not exists. Please enter the correct content");
            }

            ud10HdocvariablesService.delete(variable.trim());

            logger.info("删除HDOC Variable成功");
            return ApiResponse.success("Success");
        } catch (Exception e) {
            logger.error("删除HDOC Variable失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
