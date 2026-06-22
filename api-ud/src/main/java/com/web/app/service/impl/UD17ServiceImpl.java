package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.domain.Entity.UserInfo;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD17Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * UD17 Service Implementation
 * 实现HDoc用户管理的业务逻辑
 */
@Slf4j
@Service
public class UD17ServiceImpl implements UD17Service {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public ApiResponse<?> getMarketList() {
        log.info("========== UD17 Service: Get Market List ==========");

        try {
            List<MarketMaster> marketList = hdocDocumentListMapper.selectMarketList();

            if (marketList == null || marketList.isEmpty()) {
                log.warn("Market list is empty");
                return ApiResponse.error(404, "市场列表为空");
            }

            log.info("Market list size: {}", marketList.size());
            return ApiResponse.success("获取市场列表成功", marketList);

        } catch (Exception e) {
            log.error("Error getting market list", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> getUserInfo(HdocDocumentList request) {
        log.info("========== UD17 Service: Get User Info ==========");
        log.info("userId: {}, userName: {}", request.getUserId(), request.getUserName());

        try {
            String userId = request.getUserId() != null ? request.getUserId().trim() : "";
            String userName = request.getUserName() != null ? request.getUserName().trim() : "";

            // 参数校验
            if (userId.isEmpty() && userName.isEmpty()) {
                return ApiResponse.error(400, "UserId或UserName不能为空");
            }

            if (userId.length() > 20) {
                return ApiResponse.error(400, "UserId长度不能超过20字符");
            }
            if (userName.length() > 100) {
                return ApiResponse.error(400, "UserName长度不能超过100字符");
            }

            // 查询用户信息
            UserInfo userInfo = hdocDocumentListMapper.selectUserInfo(
                    userId.isEmpty() ? null : userId,
                    userName.isEmpty() ? null : userName
            );

            if (userInfo == null) {
                log.warn("User not found: userId={}, userName={}", userId, userName);
                return ApiResponse.error(404, "We didn't recognize the userid you entered. Please try again.");
            }

            // 构建返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("userid", userInfo.getUserId());
            data.put("username", userInfo.getUsername());
            data.put("responsible", userInfo.getResponsible());
            data.put("userposition", userInfo.getUserposition());
            data.put("email", userInfo.getEMmail());

            log.info("User found: {}", userInfo.getUserId());
            return ApiResponse.success("获取用户信息成功", data);

        } catch (Exception e) {
            log.error("Error getting user info", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> getUserPermissions(HdocDocumentList request) {
        log.info("========== UD17 Service: Get User Permissions ==========");
        log.info("userId: {}", request.getUserId());

        try {
            String userId = request.getUserId() != null ? request.getUserId().trim() : "";

            // 参数校验
            if (userId.isEmpty()) {
                return ApiResponse.error(400, "UserId不能为空");
            }

            if (userId.length() > 20) {
                return ApiResponse.error(400, "UserId长度不能超过20字符");
            }

            // 检查用户是否存在
            int userCount = hdocDocumentListMapper.countUserById(userId);
            if (userCount == 0) {
                log.warn("User not found: userId={}", userId);
                return ApiResponse.error(404, "We didn't recognize the userid you entered. Please try again.");
            }

            // 查询功能权限
            List<Map<String, String>> functions = hdocDocumentListMapper.selectFunctionAuth(userId);
            if (functions == null) {
                functions = new ArrayList<>();
            }

            // 查询市场权限
            List<Map<String, String>> markets = hdocDocumentListMapper.selectMarketAuth(userId);
            if (markets == null) {
                markets = new ArrayList<>();
            }

            // 构建返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("functions", functions);
            data.put("markets", markets);

            log.info("User permissions found: {} functions, {} markets", functions.size(), markets.size());
            return ApiResponse.success("获取用户权限成功", data);

        } catch (Exception e) {
            log.error("Error getting user permissions", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> updateRole(HdocDocumentList request) {
        log.info("========== UD17 Service: Update Role ==========");
        log.info("userId: {}, market: {}, type: {}, bu: {}, function: {}",
                request.getUserId(), request.getMarket(), request.getType(),
                request.getBu(), request.getFunction());

        try {
            String userId = request.getUserId() != null ? request.getUserId().trim() : "";
            String market = request.getMarket() != null ? request.getMarket().trim() : "";
            String type = request.getType() != null ? request.getType().trim() : "";
            String bu = request.getBu() != null ? request.getBu().trim() : "";
            String function = request.getFunction() != null ? request.getFunction().trim() : "";

            // 参数校验
            if (userId.isEmpty()) {
                return ApiResponse.error(400, "USERID不能为空");
            }

            // 检查用户是否存在
            int userCount = hdocDocumentListMapper.countUserById(userId);
            if (userCount == 0) {
                log.warn("User not found: userId={}", userId);
                return ApiResponse.error(404, "We didn't recognize the userid you entered. Please try again.");
            }

            // 获取当前操作用户
            String currentUser = request.getUpdateUser() != null && !request.getUpdateUser().trim().isEmpty()
                    ? request.getUpdateUser().trim() : "SYSTEM";
            String updateProcess = "UD17_UPDATE_ROLE";

            // 更新HDOC_MARKET_AUTH表
            if (!market.isEmpty() && !type.isEmpty()) {
                hdocDocumentListMapper.updateMarketAuth(userId, market, type, bu, currentUser, updateProcess);
            }

            // 更新HDOC_FUNCTION_AUTH表
            if (!function.isEmpty()) {
                hdocDocumentListMapper.updateFunctionAuth(function, userId, currentUser, updateProcess);
            }

            // 构建返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("userid", userId);
            data.put("market", market);
            data.put("type", type);
            data.put("bu", bu);
            data.put("function", function);

            log.info("Role updated successfully for user: {}", userId);
            return ApiResponse.success("更新用户角色成功", data);

        } catch (Exception e) {
            log.error("Error updating role", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> deleteRole(HdocDocumentList request) {
        log.info("========== UD17 Service: Delete Role ==========");
        log.info("userId: {}, market: {}, type: {}, bu: {}, function: {}",
                request.getUserId(), request.getMarket(), request.getType(),
                request.getBu(), request.getFunction());

        try {
            String userId = request.getUserId() != null ? request.getUserId().trim() : "";
            String market = request.getMarket() != null ? request.getMarket().trim() : "";
            String type = request.getType() != null ? request.getType().trim() : "";
            String bu = request.getBu() != null ? request.getBu().trim() : "";
            String function = request.getFunction() != null ? request.getFunction().trim() : "";

            // 参数校验
            if (userId.isEmpty()) {
                return ApiResponse.error(400, "USERID不能为空");
            }

            // 删除该用户所有权限记录（全量替换）
            int deletedMarket = hdocDocumentListMapper.deleteAllMarketAuth(userId);
            int deletedFunction = hdocDocumentListMapper.deleteAllFunctionAuth(userId);
            log.info("Deleted all permissions for user {}: {} market records, {} function records",
                    userId, deletedMarket, deletedFunction);

            // 构建返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("userid", userId);
            data.put("function", function);

            log.info("Role deleted successfully for user: {}", userId);
            return ApiResponse.success("删除用户角色成功", data);

        } catch (Exception e) {
            log.error("Error deleting role", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
}
