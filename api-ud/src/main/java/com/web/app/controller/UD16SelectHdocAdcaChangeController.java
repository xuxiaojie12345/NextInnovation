package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD16SelectHdocAdcaChangeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD16_ADChange 控制器
 * 提供AD Change信息的新增和删除接口
 */
@RestController
@RequestMapping("/api/ad-change")
@Api(tags = "UD16-AD变更管理")
public class UD16SelectHdocAdcaChangeController {

    private static final Logger logger = LogManager.getLogger(UD16SelectHdocAdcaChangeController.class);

    @Autowired
    private UD16SelectHdocAdcaChangeService ud16SelectHdocAdcaChangeService;

    /**
     * 新增AD Change
     *
     * @param params 请求参数（包含serie, chnr, desc）
     * @return 统一响应对象
     */
    @PostMapping("/insert")
    @ApiOperation(value = "新增AD Change", notes = "向HDOC_ADCA_CHANGE表插入新记录")
    public ApiResponse<Void> insert(@RequestBody Map<String, Object> params) {

        logger.info("接收到新增AD Change请求");

        try {
            String serie = (String) params.get("serie");
            String chnr = (String) params.get("chnr");

            if (serie == null || serie.trim().isEmpty()) {
                return ApiResponse.error("Serie is required");
            }
            if (chnr == null || chnr.trim().isEmpty()) {
                return ApiResponse.error("Chnr is required");
            }

            ud16SelectHdocAdcaChangeService.insert(params);

            logger.info("新增AD Change成功");
            return ApiResponse.success("新增成功");
        } catch (Exception e) {
            logger.error("新增AD Change失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除AD Change
     *
     * @param params 请求参数（包含serie, chnr）
     * @return 统一响应对象
     */
    @PostMapping("/update")
    @ApiOperation(value = "删除AD Change", notes = "从HDOC_ADCA_CHANGE表中删除记录")
    public ApiResponse<Void> delete(@RequestBody Map<String, Object> params) {

        logger.info("接收到删除AD Change请求");

        try {
            String serie = (String) params.get("serie");
            String chnr = (String) params.get("chnr");

            if (serie == null || serie.trim().isEmpty()) {
                return ApiResponse.error("Serie is required");
            }
            if (chnr == null || chnr.trim().isEmpty()) {
                return ApiResponse.error("Chnr is required");
            }

            ud16SelectHdocAdcaChangeService.delete(params);

            logger.info("删除AD Change成功");
            return ApiResponse.success("删除成功");
        } catch (Exception e) {
            logger.error("删除AD Change失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
