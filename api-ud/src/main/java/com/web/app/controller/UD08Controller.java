package com.web.app.controller;

import com.web.app.domain.UD08AddRequest;
import com.web.app.domain.UD08DeleteRequest;
import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.UD08UpdateRequest;
import com.web.app.domain.ApiResponse;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.domain.entity.MarketMaster;
import com.web.app.domain.entity.ProductClassMaster;
import com.web.app.service.UD08Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UD08控制器
 * 提供UD08HomologationVariablesApi接口 - 认证变量管理的增删改查
 */
@RestController
@RequestMapping("/api/ud08")
/**

 * UD08Controller

 */

public class UD08Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD08Controller.class);

    @Autowired
    /** ud08Service */

    private UD08Service ud08Service;

    /**
     * UD08SelectProductclassmaster
     * 获取Product Class下拉列表数据
     * GET /api/ud08/selectproductclassmaster
     */
    @GetMapping("/selectproductclassmaster")
    /**

     * selectProductClassMaster

     */

    public ResponseEntity<List<ProductClassMaster>> selectProductClassMaster() {
        try {
            List<ProductClassMaster> list = ud08Service.selectProductClassMaster();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            logger.error("UD08SelectProductclassmaster error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * UD08SelectMarketmaster
     * 获取Market下拉列表数据
     * GET /api/ud08/selectmarketmaster
     */
    @GetMapping("/selectmarketmaster")
    /**

     * selectMarketMaster

     */

    public ResponseEntity<List<MarketMaster>> selectMarketMaster() {
        try {
            List<MarketMaster> list = ud08Service.selectMarketMaster();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            logger.error("UD08SelectMarketmaster error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * UD08SelectHdocvariables
     * 获取HDOC_VARIABLES表中的所有VARIABLE字段
     * GET /api/ud08/selecthdocvariables
     */
    @GetMapping("/selecthdocvariables")
    /**

     * selectHdocVariables

     */

    public ResponseEntity<List<HdocVariable>> selectHdocVariables() {
        try {
            List<HdocVariable> list = ud08Service.selectHdocVariables();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            logger.error("UD08SelectHdocvariables error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * UD08Add
     * 新增用户自定义规则记录
     * POST /api/ud08/add
     */
    @PostMapping("/add")
    /**

     * add

     */

    public ApiResponse<String> add(@RequestBody UD08AddRequest request) {
        logger.info("UD08Add called - productClass: {}, number: {}, market: {}",
                request.getProductClass(), request.getNumber(), request.getMarket());

        // 参数非空校验
        if (request.getProductClass() == null || request.getProductClass().trim().isEmpty()) {
            return ApiResponse.error(400, "Product class is required.");
        }
        if (request.getNumber() == null || request.getNumber().trim().isEmpty()) {
            return ApiResponse.error(400, "Number is required.");
        }
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            return ApiResponse.error(400, "Market is required.");
        }

        try {
            String errorMsg = ud08Service.UD08Add(request);
            if (errorMsg != null) {
                // 主键冲突返回409
                if (errorMsg.contains("Primary key")) {
                    return ApiResponse.error(409, errorMsg);
                }
                // Variable不存在返回400
                return ApiResponse.error(400, errorMsg);
            }
            return ApiResponse.success("Record added successfully.");
        } catch (Exception e) {
            logger.error("UD08Add error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD08Update
     * 更新用户自定义规则记录
     * POST /api/ud08/update
     */
    @PostMapping("/update")
    /**

     * update

     */

    public ApiResponse<String> update(@RequestBody UD08UpdateRequest request) {
        logger.info("UD08Update called - productClass: {}, number: {}, market: {}",
                request.getProductClass(), request.getNumber(), request.getMarket());

        // 参数非空校验
        if (request.getProductClass() == null || request.getProductClass().trim().isEmpty()) {
            return ApiResponse.error(400, "Product class is required.");
        }
        if (request.getNumber() == null || request.getNumber().trim().isEmpty()) {
            return ApiResponse.error(400, "Number is required.");
        }
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            return ApiResponse.error(400, "Market is required.");
        }

        try {
            String errorMsg = ud08Service.UD08Update(request);
            if (errorMsg != null) {
                if (errorMsg.contains("Data does not exist")) {
                    return ApiResponse.error(404, errorMsg);
                }
                if (errorMsg.contains("Primary key")) {
                    return ApiResponse.error(409, errorMsg);
                }
                return ApiResponse.error(400, errorMsg);
            }
            return ApiResponse.success("Record updated successfully.");
        } catch (Exception e) {
            logger.error("UD08Update error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD08Delete
     * 删除用户自定义规则记录
     * POST /api/ud08/delete
     */
    @PostMapping("/delete")
    /**

     * delete

     */

    public ApiResponse<String> delete(@RequestBody UD08DeleteRequest request) {
        logger.info("UD08Delete called - productClass: {}, number: {}, market: {}",
                request.getProductClass(), request.getNumber(), request.getMarket());

        // 参数非空校验
        if (request.getProductClass() == null || request.getProductClass().trim().isEmpty()) {
            return ApiResponse.error(400, "Product class is required.");
        }
        if (request.getNumber() == null || request.getNumber().trim().isEmpty()) {
            return ApiResponse.error(400, "Number is required.");
        }
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            return ApiResponse.error(400, "Market is required.");
        }

        try {
            String errorMsg = ud08Service.UD08Delete(request);
            if (errorMsg != null) {
                return ApiResponse.error(404, errorMsg);
            }
            return ApiResponse.success("Record deleted successfully.");
        } catch (Exception e) {
            logger.error("UD08Delete error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD08Search
     * 根据搜索条件查询用户自定义规则列表
     * POST /api/ud08/search
     */
    @PostMapping("/search")
    /**

     * search

     */

    public ApiResponse<List<HdocUserDefinedRules>> search(@RequestBody UD08SearchRequest request) {
        logger.info("UD08Search called - productClass: {}, number: {}, market: {}, variable: {}",
                request.getProductClass(), request.getNumber(), request.getMarket(), request.getVariable());

        try {
            List<HdocUserDefinedRules> list = ud08Service.UD08Search(request);
            return ApiResponse.success(list);
        } catch (Exception e) {
            logger.error("UD08Search error", e);
            return ApiResponse.serverError();
        }
    }
}
