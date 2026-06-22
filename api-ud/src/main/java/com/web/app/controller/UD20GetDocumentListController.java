package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD20GetDocumentListService;
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
 * UD20_GetDocumentList 控制器
 * 提供文档列表查询接口
 */
@RestController
@RequestMapping("/api/marketdocumentsettingslist")
@Api(tags = "UD20-文档列表查询")
public class UD20GetDocumentListController {

    private static final Logger logger = LogManager.getLogger(UD20GetDocumentListController.class);

    @Autowired
    private UD20GetDocumentListService ud20GetDocumentListService;

    /**
     * 查询文档列表
     *
     * @param documentType 文档类型
     * @return 统一响应对象
     */
    @GetMapping("/documentlist")
    @ApiOperation(value = "查询文档列表", notes = "根据条件查询HDOC_DOCUMENT_LIST表中的文档信息")
    public ApiResponse<Map<String, Object>> getDocumentList(
            @RequestParam(required = false) String documentType) {

        logger.info("接收到查询文档列表请求");

        try {
            Map<String, Object> params = new HashMap<>();
            params.put("documentType", documentType);

            List<Map<String, Object>> documents = ud20GetDocumentListService.getDocumentList(params);

            Map<String, Object> data = new HashMap<>();
            data.put("documents", documents);

            logger.info("查询文档列表完成，共{}条记录", documents.size());
            return ApiResponse.success("查询成功", data);
        } catch (Exception e) {
            logger.error("查询文档列表失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
