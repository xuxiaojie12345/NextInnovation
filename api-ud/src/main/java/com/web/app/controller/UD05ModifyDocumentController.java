package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.SelectVariableModificationResponse;
import com.web.app.dto.UD05UpdateModificationRequest;
import com.web.app.service.UD05ModifyDocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD05_ModifyDocument 控制器
 * 提供变量修改信息的查询和更新接口
 */
@RestController
@RequestMapping("/api/ud05")
@Api(tags = "UD05-修改文档管理")
public class UD05ModifyDocumentController {

    private static final Logger logger = LogManager.getLogger(UD05ModifyDocumentController.class);

    @Autowired
    private UD05ModifyDocumentService ud05ModifyDocumentService;

    /**
     * 查询变量修改信息（Select）
     * 根据底盘号和市场，获取所有HDOC变量及其待发布的修改值
     *
     * @param chassisNo 底盘号（包含系列前缀，如"JPCT028321"）
     * @param market 市场
     * @return 统一响应对象，包含变量修改列表
     */
    @GetMapping("/selectvariablemodification")
    @ApiOperation(value = "查询变量修改信息", notes = "根据底盘号和市场获取所有变量及其修改值")
    public ApiResponse<SelectVariableModificationResponse> selectVariableModification(
            @RequestParam("chassisNo") String chassisNo,
            @RequestParam("market") String market) {

        logger.info("接收到查询变量修改信息请求，chassisNo: {}, market: {}", chassisNo, market);

        try {
            // 参数校验
            if (chassisNo == null || chassisNo.trim().isEmpty()) {
                return ApiResponse.error("Chassis no is required");
            }
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error("Market is required");
            }

            // 从 chassisNo 中提取 serie（字母前缀）和 number（数字部分）
            String serie = chassisNo.trim().replaceAll("[0-9]", "");
            String number = chassisNo.trim().replaceAll("[A-Za-z]", "");

            if (serie.isEmpty()) {
                return ApiResponse.error("Invalid chassis no format: missing serie prefix");
            }
            if (number.isEmpty()) {
                return ApiResponse.error("Invalid chassis no format: missing number part");
            }

            // 调用服务层查询变量修改信息
            SelectVariableModificationResponse response =
                    ud05ModifyDocumentService.selectVariableModification(serie, number);

            logger.info("变量修改信息查询成功");
            return ApiResponse.success("Success", response);

        } catch (Exception e) {
            logger.error("查询变量修改信息失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新修改变量值（Update）
     * 批量更新HDOC_ADCA_MODIFICATION表中的NEWVAL字段
     *
     * @param request 更新请求对象（包含底盘号、修改列表）
     * @return 统一响应对象
     */
    @PostMapping("/updatemodification")
    @ApiOperation(value = "更新修改变量值", notes = "批量更新HDOC_ADCA_MODIFICATION表中的NEWVAL字段")
    public ApiResponse<Void> updateModification(@RequestBody UD05UpdateModificationRequest request) {

        logger.info("接收到更新修改变量值请求，chassisNo: {}", request.getChassisNo());

        try {
            // 参数校验
            if (request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
                return ApiResponse.error("Chassis no is required");
            }
            if (request.getModifications() == null || request.getModifications().isEmpty()) {
                return ApiResponse.error("NO UNRELEASED VERSION EXISTS!");
            }

            // 自动提取 serie 和 number
            String rawChassisNo = request.getChassisNo().trim();
            String serie = rawChassisNo.replaceAll("[0-9]", "");
            String number = rawChassisNo.replaceAll("[A-Za-z]", "");

            if (serie.isEmpty() || number.isEmpty()) {
                return ApiResponse.error("Invalid chassis no format");
            }
            request.setSerie(serie);
            request.setChassisNo(number);

            // 校验是否至少包含一个有效的新值
            boolean hasValidValue = request.getModifications().stream()
                    .anyMatch(item -> item.getNewValue() != null && !item.getNewValue().trim().isEmpty());
            if (!hasValidValue) {
                return ApiResponse.error("NO UNRELEASED VERSION EXISTS!");
            }

            // 调用服务层更新变量值
            ud05ModifyDocumentService.updateModification(request);

            logger.info("变量修改值更新成功");
            return ApiResponse.success("Success");

        } catch (IllegalArgumentException e) {
            logger.warn("更新参数校验失败: {}", e.getMessage());
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            logger.error("更新变量修改值失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
