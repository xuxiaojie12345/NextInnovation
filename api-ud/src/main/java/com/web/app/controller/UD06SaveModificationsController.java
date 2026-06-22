package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD06ModificationDetailResponse;
import com.web.app.service.UD06SaveModificationsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD06_SaveModifications 控制器
 * 提供修改详情的查询接口
 */
@RestController
@RequestMapping("/api/ud06")
@Api(tags = "UD06-保存修改管理")
public class UD06SaveModificationsController {

    private static final Logger logger = LogManager.getLogger(UD06SaveModificationsController.class);

    @Autowired
    private UD06SaveModificationsService ud06SaveModificationsService;

    /**
     * 查询修改详情
     * 根据底盘号获取 Doctype, Version, Storing 等信息
     *
     * @param chassisNo 底盘号（包含系列前缀，如"JPCT028321"）
     * @return 统一响应对象，包含修改详情
     */
    @GetMapping("/selectmodificationdetails")
    @ApiOperation(value = "查询修改详情", notes = "根据底盘号获取修改详情（Doctype, Version, Storing等）")
    public ApiResponse<UD06ModificationDetailResponse> selectModificationDetails(
            @RequestParam("chassisNo") String chassisNo) {

        logger.info("接收到查询修改详情请求，chassisNo: {}", chassisNo);

        try {
            if (chassisNo == null || chassisNo.trim().isEmpty()) {
                return ApiResponse.error("Chassis no is required");
            }

            // 从 chassisNo 中提取 serie（字母前缀）和 number（数字部分）
            String serie = chassisNo.trim().replaceAll("[0-9]", "");
            String number = chassisNo.trim().replaceAll("[A-Za-z]", "");

            if (serie.isEmpty() || number.isEmpty()) {
                return ApiResponse.error("Invalid chassis no format");
            }

            UD06ModificationDetailResponse response =
                    ud06SaveModificationsService.selectModificationDetails(serie, number);

            logger.info("修改详情查询成功");
            return ApiResponse.success("Success", response);

        } catch (Exception e) {
            logger.error("查询修改详情失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
