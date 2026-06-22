package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
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
 * UD09_DeleteHdocuserdefinedrules 控制器
 * 提供认证参数（用户定义规则）的查询与批量删除接口
 */
@RestController
@RequestMapping("/api/ud09")
@Api(tags = "UD09-认证参数查询删除")
public class UD09DeleteHdocuserdefinedrulesController {

    private static final Logger logger = LogManager.getLogger(UD09DeleteHdocuserdefinedrulesController.class);

    @Autowired
    private UD09DeleteHdocuserdefinedrulesService ud09DeleteHdocuserdefinedrulesService;

    /**
     * 搜索认证参数规则
     *
     * @param pc        产品类别
     * @param number    编号
     * @param market    市场
     * @param variable  变量
     * @param val       值
     * @param string1   字符串1
     * @param string2   字符串2
     * @param comments  备注
     * @return 统一响应对象，包含规则列表
     */
    @GetMapping("/search")
    @ApiOperation(value = "搜索认证参数规则", notes = "根据查询条件从HDOC_USER_DEFINED_RULES表检索认证参数信息")
    public ApiResponse<Map<String, Object>> search(
            @RequestParam(required = false) String pc,
            @RequestParam(required = false) String number,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String variable,
            @RequestParam(required = false) String val,
            @RequestParam(required = false) String string1,
            @RequestParam(required = false) String string2,
            @RequestParam(required = false) String comments) {

        logger.info("接收到搜索认证参数规则请求");

        try {
            Map<String, Object> params = new HashMap<>();
            params.put("pc", pc);
            params.put("num", number);
            params.put("market", market);
            params.put("variable", variable);
            params.put("val", val);
            params.put("vs", string1);
            params.put("vs2", string2);
            params.put("comments", comments);

            List<Map<String, Object>> records = ud09DeleteHdocuserdefinedrulesService.search(params);

            Map<String, Object> data = new HashMap<>();
            data.put("records", records);
            data.put("count", records.size());

            logger.info("搜索完成，共{}条记录", records.size());
            return ApiResponse.success("Success", data);
        } catch (Exception e) {
            logger.error("搜索认证参数规则失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 批量删除选中的认证参数规则
     *
     * @param request 请求体（包含选中的记录列表）
     * @return 统一响应对象
     */
    @PostMapping("/deleteselected")
    @ApiOperation(value = "批量删除认证参数规则", notes = "根据选中的记录信息批量删除HDOC_USER_DEFINED_RULES表中的记录")
    public ApiResponse<Void> deleteSelected(@RequestBody Map<String, Object> request) {

        logger.info("接收到批量删除认证参数规则请求");

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> selectedRecords = (List<Map<String, Object>>) request.get("selectedRecords");

            if (selectedRecords == null || selectedRecords.isEmpty()) {
                return ApiResponse.error("No records selected for deletion");
            }

            ud09DeleteHdocuserdefinedrulesService.deleteSelected(selectedRecords);

            logger.info("批量删除成功，共删除{}条记录", selectedRecords.size());
            return ApiResponse.success("记录删除成功");
        } catch (Exception e) {
            logger.error("批量删除认证参数规则失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
