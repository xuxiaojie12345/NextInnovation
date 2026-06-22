package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD15_Selecthdocsenddatavinplate 控制器
 * 提供VIN Plate数据传输数据的查看与状态更新接口
 */
@RestController
@RequestMapping("/api/vin-plate")
@Api(tags = "UD15-VIN Plate管理")
public class UD15SelecthdocsenddatavinplateController {

    private static final Logger logger = LogManager.getLogger(UD15SelecthdocsenddatavinplateController.class);

    @Autowired
    private UD15SelecthdocsenddatavinplateService ud15SelecthdocsenddatavinplateService;

    /**
     * 查看VIN Plate信息
     *
     * @param chassisNumber 底盘号
     * @return 统一响应对象
     */
    @GetMapping("/viewinfo")
    @ApiOperation(value = "查看VIN Plate信息", notes = "根据底盘号查询VIN Plate的详细信息")
    public ApiResponse<Map<String, Object>> viewInfo(@RequestParam("chassisNumber") String chassisNumber) {

        logger.info("接收到查看VIN Plate信息请求，chassisNumber: {}", chassisNumber);

        try {
            if (chassisNumber == null || chassisNumber.trim().isEmpty()) {
                return ApiResponse.error("Chassis number is required");
            }

            Map<String, Object> data = ud15SelecthdocsenddatavinplateService.viewInfo(chassisNumber.trim());
            return ApiResponse.success("查询成功", data);
        } catch (Exception e) {
            logger.error("查看VIN Plate信息失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 设置重新生成
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/setregenerate")
    @ApiOperation(value = "设置重新生成", notes = "将指定底盘的STATUS更新为0（重新生成）")
    public ApiResponse<Void> setRegenerate(@RequestBody Map<String, String> params) {

        logger.info("接收到设置重新生成请求");

        try {
            String chassisNumber = params.get("chassisNumber");
            if (chassisNumber == null || chassisNumber.trim().isEmpty()) {
                return ApiResponse.error("Chassis number is required");
            }

            ud15SelecthdocsenddatavinplateService.setRegenerate(chassisNumber.trim());
            return ApiResponse.success("状态已更新为重生成");
        } catch (Exception e) {
            logger.error("设置重新生成失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 设置完成
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/setok")
    @ApiOperation(value = "设置完成", notes = "将指定底盘的STATUS更新为1（完成）")
    public ApiResponse<Void> setOk(@RequestBody Map<String, String> params) {

        logger.info("接收到设置完成请求");

        try {
            String chassisNumber = params.get("chassisNumber");
            if (chassisNumber == null || chassisNumber.trim().isEmpty()) {
                return ApiResponse.error("Chassis number is required");
            }

            ud15SelecthdocsenddatavinplateService.setOk(chassisNumber.trim());
            return ApiResponse.success("状态已更新为完成");
        } catch (Exception e) {
            logger.error("设置完成失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 切换到高级信息
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/changetoadvanced")
    @ApiOperation(value = "切换到高级信息", notes = "将指定底盘的STATUS更新为0，TYPE更新为'2'（高级信息）")
    public ApiResponse<Void> changeToAdvanced(@RequestBody Map<String, String> params) {

        logger.info("接收到切换到高级信息请求");

        try {
            String chassisNumber = params.get("chassisNumber");
            if (chassisNumber == null || chassisNumber.trim().isEmpty()) {
                return ApiResponse.error("Chassis number is required");
            }

            ud15SelecthdocsenddatavinplateService.changeToAdvanced(chassisNumber.trim());
            return ApiResponse.success("状态已更新为高级信息");
        } catch (Exception e) {
            logger.error("切换到高级信息失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
