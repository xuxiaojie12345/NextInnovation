package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD09HomologationVariablesResultService;
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
 * UD09_HomologationVariablesResult 控制器
 * 提供认证参数检索结果的查询和删除接口
 */
@RestController
@RequestMapping("/api/ud09result")
@Api(tags = "UD09-认证参数检索结果")
public class UD09HomologationVariablesResultController {

    private static final Logger logger = LogManager.getLogger(UD09HomologationVariablesResultController.class);

    @Autowired
    private UD09HomologationVariablesResultService ud09HomologationVariablesResultService;

    /**
     * 检索用户定义规则
     *
     * @param pc       产品类别
     * @param number   编号
     * @param market   市场
     * @param variable 变量
     * @param val      值
     * @param vs       Variant string
     * @param vs2      Variant string.2
     * @param comments 备注
     * @param addDate  添加日期
     * @param deleteDate 删除日期
     * @param updateUser 更新用户
     * @param updateDatetime 更新时间
     * @return 统一响应对象，包含检索结果列表和总数
     */
    @GetMapping("/search")
    @ApiOperation(value = "检索用户定义规则", notes = "根据条件查询HDOC_USER_DEFINED_RULES表，返回匹配的规则列表")
    public ApiResponse<Map<String, Object>> search(
            @RequestParam(required = false) String pc,
            @RequestParam(required = false) String number,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String variable,
            @RequestParam(required = false) String val,
            @RequestParam(required = false) String vs,
            @RequestParam(required = false) String vs2,
            @RequestParam(required = false) String comments,
            @RequestParam(required = false) String addDate,
            @RequestParam(required = false) String deleteDate,
            @RequestParam(required = false) String updateUser,
            @RequestParam(required = false) String updateDatetime) {

        logger.info("接收到检索用户定义规则请求");

        try {
            Map<String, Object> params = new HashMap<>();
            if (pc != null && !pc.trim().isEmpty()) params.put("pc", pc);
            if (number != null && !number.trim().isEmpty()) params.put("num", number);
            if (market != null && !market.trim().isEmpty()) params.put("market", market);
            if (variable != null && !variable.trim().isEmpty()) params.put("variable", variable);
            if (val != null && !val.trim().isEmpty()) params.put("val", val);
            if (vs != null && !vs.trim().isEmpty()) params.put("vs", vs);
            if (vs2 != null && !vs2.trim().isEmpty()) params.put("vs2", vs2);
            if (comments != null && !comments.trim().isEmpty()) params.put("comments", comments);
            if (addDate != null && !addDate.trim().isEmpty()) params.put("addDate", addDate);
            if (deleteDate != null && !deleteDate.trim().isEmpty()) params.put("deleteDate", deleteDate);

            List<Map<String, Object>> records = ud09HomologationVariablesResultService.searchUserDefinedRules(params);

            Map<String, Object> data = new HashMap<>();
            data.put("records", records);
            data.put("count", records.size());

            logger.info("检索用户定义规则成功，共{}条记录", records.size());
            return ApiResponse.success("Success", data);
        } catch (Exception e) {
            logger.error("检索用户定义规则失败", e);
            return ApiResponse.error(500, "获取数据失败");
        }
    }

    /**
     * 删除选中的用户定义规则
     *
     * @param params 请求参数（包含pc, number, market）
     * @return 统一响应对象
     */
    @PostMapping("/deleteselected")
    @ApiOperation(value = "删除选中规则", notes = "根据主键删除HDOC_USER_DEFINED_RULES表中的选中记录")
    public ApiResponse<Void> deleteSelected(@RequestBody Map<String, String> params) {

        logger.info("接收到删除选中规则请求");

        try {
            String pc = params.get("pc");
            String number = params.get("number");
            String market = params.get("market");

            if (pc == null || pc.trim().isEmpty() ||
                number == null || number.trim().isEmpty() ||
                market == null || market.trim().isEmpty()) {
                return ApiResponse.error(400, "缺少必要参数");
            }

            ud09HomologationVariablesResultService.deleteUserDefinedRule(pc, number, market);

            logger.info("删除选中规则成功");
            return ApiResponse.success("记录删除成功");
        } catch (Exception e) {
            logger.error("删除选中规则失败", e);
            return ApiResponse.error(500, "获取数据失败");
        }
    }
}
