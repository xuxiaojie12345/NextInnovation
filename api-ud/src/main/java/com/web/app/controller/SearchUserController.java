package com.web.app.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.SearchUserRequest;
import com.web.app.dto.SearchUserResponse;
import com.web.app.service.SearchUserService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * SearchUser 控制器层
 * 对应设计书 4.1 SearchUserApi：
 *   Method：GET
 *   Endpoint：/api/SearchUser
 */
@Api(tags = "SearchUserApi - 用户信息检索")
@RestController
@RequestMapping("/api")
public class SearchUserController {

    private static final Logger logger = LogManager.getLogger(SearchUserController.class);

    @Autowired
    private SearchUserService searchUserService;

    /**
     * 用户信息检索接口
     * 4.2 接收前端请求，通过 SearchUserRequest 封装请求参数（serid/user/market/function）
     * 4.3 调用 SearchUserService.searchUser() 传递至业务逻辑层处理
     * 异常处理：参数校验失败返回业务错误消息；系统异常返回 code=500
     */
    @ApiOperation("用户信息检索")
    @GetMapping("/SearchUser")
    public ApiResponse<SearchUserResponse> searchUser(SearchUserRequest request) {
        try {
            SearchUserResponse response = searchUserService.searchUser(request);
            return ApiResponse.success(response);
        } catch (IllegalArgumentException e) {
            // 参数校验失败：返回有意义的错误信息（设计书第 5 章异常处理 No.1～No.3）
            logger.warn("SearchUserApi 参数校验失败: {}", e.getMessage());
            return ApiResponse.error(500, e.getMessage());
        } catch (Exception e) {
            // 系统异常：返回设计书 Response Error (500)
            logger.error("SearchUserApi 处理异常", e);
            return ApiResponse.error(500, "Internal server error");
        }
    }
}
