package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD08HomologationVariablesService;
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
 * UD08_HomologationVariables 控制器
 * 提供认证参数管理（产品类别、市场、自定义规则）的CRUD接口
 */
@RestController
@RequestMapping("/api/ud08")
@Api(tags = "UD08-认证参数管理")
public class UD08HomologationVariablesController {

    private static final Logger logger = LogManager.getLogger(UD08HomologationVariablesController.class);

    @Autowired
    private UD08HomologationVariablesService ud08HomologationVariablesService;

    /**
     * 获取产品类别列表（初始化下拉框）
     *
     * @return 统一响应对象，包含产品类别列表
     */
    @GetMapping("/selectproductclassmaster")
    @ApiOperation(value = "获取产品类别列表", notes = "查询PRODUCT_CLASS_MASTER表获取所有产品类别，用于初始化下拉框")
    public ApiResponse<List<Map<String, Object>>> selectProductClassMaster() {
        logger.info("接收到获取产品类别列表请求");

        try {
            List<Map<String, Object>> productClasses = ud08HomologationVariablesService.selectProductClassMaster();
            logger.info("产品类别列表返回成功，共{}条记录", productClasses.size());
            return ApiResponse.success("Success", productClasses);
        } catch (Exception e) {
            logger.error("获取产品类别列表失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取市场列表（初始化下拉框）
     *
     * @return 统一响应对象，包含市场列表
     */
    @GetMapping("/selectmarketmaster")
    @ApiOperation(value = "获取市场列表", notes = "查询MARKET_MASTER表获取所有市场，用于初始化下拉框")
    public ApiResponse<List<Map<String, Object>>> selectMarketMaster() {
        logger.info("接收到获取市场列表请求");

        try {
            List<Map<String, Object>> markets = ud08HomologationVariablesService.selectMarketMaster();
            logger.info("市场列表返回成功，共{}条记录", markets.size());
            return ApiResponse.success("Success", markets);
        } catch (Exception e) {
            logger.error("获取市场列表失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 查询用户定义规则（存在性检查）
     *
     * @param pc     产品类别
     * @param number 编号
     * @param market 市场
     * @return 统一响应对象，包含存在性检查结果
     */
    @GetMapping("/selectuserdefined-rules")
    @ApiOperation(value = "查询用户定义规则（存在性检查）", notes = "根据主键组合查询HDOC_USER_DEFINED_RULES表，用于存在性检查")
    public ApiResponse<Map<String, Object>> selectUserDefinedRules(
            @RequestParam("pc") String pc,
            @RequestParam("number") String number,
            @RequestParam("market") String market) {

        logger.info("接收到查询用户定义规则请求，pc: {}, number: {}, market: {}", pc, number, market);

        try {
            if (pc == null || pc.trim().isEmpty()) {
                return ApiResponse.error("Product class is required");
            }
            if (number == null || number.trim().isEmpty()) {
                return ApiResponse.error("Number is required");
            }
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error("Market is required");
            }

            boolean exists = ud08HomologationVariablesService.checkUserDefinedRuleExists(pc, number, market);

            Map<String, Object> data = new HashMap<>();
            data.put("count", exists ? 1 : 0);

            logger.info("用户定义规则存在性检查完成，exists: {}", exists);
            return ApiResponse.success("Success", data);
        } catch (Exception e) {
            logger.error("查询用户定义规则失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 查询HDOC Variable是否存在（校验用）
     *
     * @param variable 变量名
     * @return 统一响应对象，包含校验结果
     */
    @GetMapping("/selecthdocvariables")
    @ApiOperation(value = "查询HDOC Variable是否存在", notes = "根据Variable值查询HDOC_VARIABLES表，用于校验是否存在")
    public ApiResponse<Map<String, Object>> selectHdocVariables(
            @RequestParam("variable") String variable) {

        logger.info("接收到查询HDOC Variable请求，variable: {}", variable);

        try {
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error("Variable is required");
            }

            boolean exists = ud08HomologationVariablesService.checkHdocVariableExists(variable);

            Map<String, Object> data = new HashMap<>();
            data.put("count", exists ? 1 : 0);

            logger.info("HDOC Variable查询完成，exists: {}", exists);
            return ApiResponse.success("Success", data);
        } catch (Exception e) {
            logger.error("查询HDOC Variable失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 新增用户定义规则
     *
     * @param params 规则参数
     * @return 统一响应对象
     */
    @PostMapping("/add")
    @ApiOperation(value = "新增用户定义规则", notes = "向HDOC_USER_DEFINED_RULES表插入一条新记录")
    public ApiResponse<Void> addUserDefinedRule(@RequestBody Map<String, Object> params) {

        logger.info("接收到新增用户定义规则请求");

        try {
            // 参数校验
            String pc = (String) params.get("pc");
            String number = (String) params.get("number");
            String market = (String) params.get("market");

            if (pc == null || pc.trim().isEmpty() ||
                number == null || number.trim().isEmpty() ||
                market == null || market.trim().isEmpty()) {
                return ApiResponse.error("Product class, Number, and Market are required for Add operation.");
            }

            // 存在性检查
            if (ud08HomologationVariablesService.checkUserDefinedRuleExists(pc, number, market)) {
                return ApiResponse.error(400, "Primary key conflict, Please enter the correct content");
            }

            // Variable校验
            String variable = (String) params.get("variable");
            if (variable != null && !variable.trim().isEmpty()) {
                String processedVariable = variable.trim();
                if (processedVariable.startsWith("TEMPLATE-")) {
                    processedVariable = processedVariable.substring("TEMPLATE-".length());
                    params.put("variable", processedVariable);
                }
                if (!ud08HomologationVariablesService.checkHdocVariableExists(processedVariable)) {
                    return ApiResponse.error(400, "Variant does not exist, Please enter the correct content");
                }
            }

            ud08HomologationVariablesService.addUserDefinedRule(params);

            logger.info("新增用户定义规则成功");
            return ApiResponse.success("Added successfully");
        } catch (Exception e) {
            logger.error("新增用户定义规则失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新用户定义规则
     *
     * @param params 规则参数
     * @return 统一响应对象
     */
    @PostMapping("/update")
    @ApiOperation(value = "更新用户定义规则", notes = "根据主键更新HDOC_USER_DEFINED_RULES表中的记录")
    public ApiResponse<Void> updateUserDefinedRule(@RequestBody Map<String, Object> params) {

        logger.info("接收到更新用户定义规则请求");

        try {
            String pc = (String) params.get("pc");
            String number = (String) params.get("number");
            String market = (String) params.get("market");

            if (pc == null || pc.trim().isEmpty() ||
                number == null || number.trim().isEmpty() ||
                market == null || market.trim().isEmpty()) {
                return ApiResponse.error("Product class, Number, and Market are required for Update operation.");
            }

            // 存在性检查
            if (!ud08HomologationVariablesService.checkUserDefinedRuleExists(pc, number, market)) {
                return ApiResponse.error(400, "Data does not exist, Please enter the correct content");
            }

            // Variable校验
            String variable = (String) params.get("variable");
            if (variable != null && !variable.trim().isEmpty()) {
                String processedVariable = variable.trim();
                if (processedVariable.startsWith("TEMPLATE-")) {
                    processedVariable = processedVariable.substring("TEMPLATE-".length());
                    params.put("variable", processedVariable);
                }
                if (!ud08HomologationVariablesService.checkHdocVariableExists(processedVariable)) {
                    return ApiResponse.error(400, "Variant does not exist, Please enter the correct content");
                }
            }

            ud08HomologationVariablesService.updateUserDefinedRule(params);

            logger.info("更新用户定义规则成功");
            return ApiResponse.success("Updated successfully");
        } catch (Exception e) {
            logger.error("更新用户定义规则失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除用户定义规则
     *
     * @param params 规则参数（包含pc, number, market）
     * @return 统一响应对象
     */
    @PostMapping("/delete")
    @ApiOperation(value = "删除用户定义规则", notes = "根据主键删除HDOC_USER_DEFINED_RULES表中的记录")
    public ApiResponse<Void> deleteUserDefinedRule(@RequestBody Map<String, Object> params) {

        logger.info("接收到删除用户定义规则请求");

        try {
            String pc = (String) params.get("pc");
            String number = (String) params.get("number");
            String market = (String) params.get("market");

            if (pc == null || pc.trim().isEmpty() ||
                number == null || number.trim().isEmpty() ||
                market == null || market.trim().isEmpty()) {
                return ApiResponse.error("Product class, Number, and Market are required for Delete operation.");
            }

            // 存在性检查
            if (!ud08HomologationVariablesService.checkUserDefinedRuleExists(pc, number, market)) {
                return ApiResponse.error(400, "Data does not exist, Please enter the correct content");
            }

            ud08HomologationVariablesService.deleteUserDefinedRule(pc, number, market);

            logger.info("删除用户定义规则成功");
            return ApiResponse.success("Deleted successfully");
        } catch (Exception e) {
            logger.error("删除用户定义规则失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
