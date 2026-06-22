package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD18HDocUserDocAdministrationService;
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
 * UD18_HDocUserDocAdministration 控制器
 * 提供用户文档权限管理的查询、更新接口
 */
@RestController
@RequestMapping("/api/user-doc-admin")
@Api(tags = "UD18-用户文档权限管理")
public class UD18HDocUserDocAdministrationController {

    private static final Logger logger = LogManager.getLogger(UD18HDocUserDocAdministrationController.class);

    @Autowired
    private UD18HDocUserDocAdministrationService ud18HDocUserDocAdministrationService;

    /**
     * 获取所有文档列表（初始化）
     *
     * @return 统一响应对象
     */
    @GetMapping("/documentlist")
    @ApiOperation(value = "获取文档列表", notes = "查询HDOC_DOCUMENT_LIST表获取全部文档信息")
    public ApiResponse<Map<String, Object>> getDocumentList() {
        logger.info("接收到获取文档列表请求");

        try {
            List<Map<String, Object>> documents = ud18HDocUserDocAdministrationService.getDocumentList();

            Map<String, Object> data = new HashMap<>();
            data.put("documents", documents);

            return ApiResponse.success("获取成功", data);
        } catch (Exception e) {
            logger.error("获取文档列表失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 查询用户文档权限
     *
     * @param userid 用户ID
     * @return 统一响应对象
     */
    @GetMapping("/selectuserdoc")
    @ApiOperation(value = "查询用户文档权限", notes = "根据用户ID查询用户已有的文档权限")
    public ApiResponse<Map<String, Object>> selectUserDoc(@RequestParam("userid") String userid) {

        logger.info("接收到查询用户文档权限请求，userid: {}", userid);

        try {
            if (userid == null || userid.trim().isEmpty()) {
                return ApiResponse.error("User ID is required");
            }

            List<Map<String, Object>> documents = ud18HDocUserDocAdministrationService.selectUserDoc(userid.trim());

            Map<String, Object> data = new HashMap<>();
            data.put("documents", documents);

            return ApiResponse.success("获取成功", data);
        } catch (Exception e) {
            logger.error("查询用户文档权限失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新用户文档权限
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/updateuserdoc")
    @ApiOperation(value = "更新用户文档权限", notes = "更新指定用户的文档访问权限")
    public ApiResponse<Void> updateUserDoc(@RequestBody Map<String, Object> params) {

        logger.info("接收到更新用户文档权限请求");

        try {
            String userid = (String) params.get("userid");
            if (userid == null || userid.trim().isEmpty()) {
                return ApiResponse.error("User ID is required");
            }

            ud18HDocUserDocAdministrationService.updateUserDoc(params);
            return ApiResponse.success("更新成功");
        } catch (Exception e) {
            logger.error("更新用户文档权限失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
