package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.DoctypeListResponse;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * UD03文档类型列表控制器
 */
@RestController
@RequestMapping("/api/UD03")
@Api(tags = "UD03-文档类型管理")
public class UD03SelectHdocdocumentlistController {

    private static final Logger logger = LogManager.getLogger(UD03SelectHdocdocumentlistController.class);

    @Autowired
    private UD03SelectHdocdocumentlistService ud03SelectHdocdocumentlistService;

    /**
     * 获取文档类型列表
     * 
     * @return 统一响应对象，包含文档类型列表
     */
    @GetMapping("/selecthdocdocumentlist")
    @ApiOperation(value = "获取文档类型列表", notes = "从HDOC_DOCUMENT_LIST表中查询所有文档类型（去重）")
    public ApiResponse<List<DoctypeListResponse>> getDoctypeList() {
        logger.info("接收到获取文档类型列表请求");

        try {
            // 调用服务层获取文档类型列表
            List<DoctypeListResponse> doctypeList = ud03SelectHdocdocumentlistService.getDoctypeList();

            logger.info("文档类型列表返回成功，共{}条记录", doctypeList.size());
            
            // 返回成功响应
            return ApiResponse.success("获取成功", doctypeList);
        } catch (Exception e) {
            logger.error("获取文档类型列表失败", e);
            return ApiResponse.error("获取失败：" + e.getMessage());
        }
    }
}
