package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD10Request;
import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.service.UD10Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UD10控制器
 * 提供UD10HdocvariablesApi接口 - HDOC_VARIABLES的增删改查
 * 对应全体APIのプロンプト.txt 【UD10HdocvariablesApi】
 */
@RestController
@RequestMapping("/api/ud10")
/**

 * UD10Controller

 */

public class UD10Controller extends BaseController {@Autowired
    /** ud10Service */

    private UD10Service ud10Service;

    /**
     * UD10Search - 根据搜索条件查询变量定义列表
     * 支持Variable、Type、Description、Created by user、Date字段的动态条件查询
     * POST /api/ud10/search
     */
    @PostMapping("/search")
    /**

     * search

     */

    public ApiResponse<List<HdocVariable>> search(@RequestBody UD10SearchRequest request) {
        logger.info("UD10Search called - variable: {}, type: {}, description: {}, userid: {}",
                request.getVariable(), request.getType(), request.getDescription(), request.getUserid());

        try {
            List<HdocVariable> list = ud10Service.search(request);
            return ApiResponse.success(list);
        } catch (Exception e) {
            logger.error("UD10Search error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * 根据Variable查询变量定义详情
     * GET /api/ud10/hdocvariables/{variable}
     */
    @GetMapping("/hdocvariables/{variable}")
    /**

     * selectByVariable

     */

    public ResponseEntity<HdocVariable> selectByVariable(@PathVariable("variable") String variable) {
        logger.info("UD10SelectByVariable called - variable: {}", variable);

        try {
            HdocVariable record = ud10Service.selectByVariable(variable);
            if (record == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            logger.error("UD10SelectByVariable error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * UD10Add - 新增变量定义记录
     * POST /api/ud10/add
     */
    @PostMapping("/add")
    /**

     * add

     */

    public ApiResponse<String> add(@RequestBody UD10Request request) {
        logger.info("UD10Add called - variable: {}, type: {}, description: {}",
                request.getVariable(), request.getType(), request.getDescription());

        // 参数非空校验
        if (request.getVariable() == null || request.getVariable().trim().isEmpty()) {
            return ApiResponse.error(400, "Variable is required.");
        }

        try {
            String errorMsg = ud10Service.add(
                    request.getVariable().trim(),
                    request.getType(),
                    request.getDescription(),
                    request.getUserid(),
                    request.getRegisterDatetime()
            );
            if (errorMsg != null) {
                if (errorMsg.contains("already exists")) {
                    return ApiResponse.error(409, errorMsg);
                }
                return ApiResponse.error(400, errorMsg);
            }
            return ApiResponse.success("Record added successfully.");
        } catch (Exception e) {
            logger.error("UD10Add error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD10Update - 更新变量定义记录
     * POST /api/ud10/update
     */
    @PostMapping("/update")
    /**

     * update

     */

    public ApiResponse<String> update(@RequestBody UD10Request request) {
        logger.info("UD10Update called - variable: {}, type: {}, description: {}",
                request.getVariable(), request.getType(), request.getDescription());

        // 参数非空校验
        if (request.getVariable() == null || request.getVariable().trim().isEmpty()) {
            return ApiResponse.error(400, "Variable is required.");
        }

        try {
            String errorMsg = ud10Service.update(
                    request.getVariable().trim(),
                    request.getType(),
                    request.getDescription(),
                    request.getUserid(),
                    request.getRegisterDatetime()
            );
            if (errorMsg != null) {
                if (errorMsg.contains("not exists")) {
                    return ApiResponse.error(404, errorMsg);
                }
                return ApiResponse.error(400, errorMsg);
            }
            return ApiResponse.success("Record updated successfully.");
        } catch (Exception e) {
            logger.error("UD10Update error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD10Delete - 删除变量定义记录
     * POST /api/ud10/delete
     */
    @PostMapping("/delete")
    /**

     * delete

     */

    public ApiResponse<String> delete(@RequestBody UD10Request request) {
        logger.info("UD10Delete called - variable: {}", request.getVariable());

        // 参数非空校验
        if (request.getVariable() == null || request.getVariable().trim().isEmpty()) {
            return ApiResponse.error(400, "Variable is required.");
        }

        try {
            String errorMsg = ud10Service.delete(request.getVariable().trim());
            if (errorMsg != null) {
                if (errorMsg.contains("not exists")) {
                    return ApiResponse.error(404, errorMsg);
                }
                return ApiResponse.error(400, errorMsg);
            }
            return ApiResponse.success("Record deleted successfully.");
        } catch (Exception e) {
            logger.error("UD10Delete error", e);
            return ApiResponse.serverError();
        }
    }
}
