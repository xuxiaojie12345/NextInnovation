package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD17HDocUserAdministrationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD17_HDocUserAdministration 控制器
 * 提供用户权限管理的查询、更新和删除接口
 */
@RestController
@RequestMapping("/api/user-admin")
@Api(tags = "UD17-用户权限管理")
public class UD17HDocUserAdministrationController {

    private static final Logger logger = LogManager.getLogger(UD17HDocUserAdministrationController.class);

    @Autowired
    private UD17HDocUserAdministrationService ud17HDocUserAdministrationService;

    /**
     * 获取用户信息和权限
     *
     * @param userid 用户ID
     * @return 统一响应对象
     */
    @GetMapping("/userinfo")
    @ApiOperation(value = "获取用户信息", notes = "根据用户ID查询用户的基本信息和权限列表")
    public ApiResponse<Map<String, Object>> getUserInfo(@RequestParam("userid") String userid) {

        logger.info("接收到获取用户信息请求，userid: {}", userid);

        try {
            if (userid == null || userid.trim().isEmpty()) {
                return ApiResponse.error("User ID is required");
            }

            Map<String, Object> data = ud17HDocUserAdministrationService.getUserInfo(userid.trim());
            return ApiResponse.success("获取成功", data);
        } catch (Exception e) {
            logger.error("获取用户信息失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新用户角色权限
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/updaterole")
    @ApiOperation(value = "更新用户角色权限", notes = "更新指定用户的角色和市场权限")
    public ApiResponse<Void> updateRole(@RequestBody Map<String, Object> params) {

        logger.info("接收到更新用户权限请求");

        try {
            String userid = (String) params.get("userid");
            if (userid == null || userid.trim().isEmpty()) {
                return ApiResponse.error("User ID is required");
            }

            ud17HDocUserAdministrationService.updateRole(params);
            return ApiResponse.success("权限更新成功");
        } catch (Exception e) {
            logger.error("更新用户权限失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除用户角色权限
     *
     * @param params 请求参数
     * @return 统一响应对象
     */
    @PostMapping("/deleterole")
    @ApiOperation(value = "删除用户角色权限", notes = "清空指定用户的所有权限")
    public ApiResponse<Void> deleteRole(@RequestBody Map<String, String> params) {

        logger.info("接收到删除用户权限请求");

        try {
            String userid = params.get("userid");
            if (userid == null || userid.trim().isEmpty()) {
                return ApiResponse.error("User ID is required");
            }

            ud17HDocUserAdministrationService.deleteRole(userid.trim());
            return ApiResponse.success("权限删除成功");
        } catch (Exception e) {
            logger.error("删除用户权限失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
