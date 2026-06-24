package com.web.app.service.impl;

import com.web.app.domain.UD17Request;
import com.web.app.mapper.UD17Mapper;
import com.web.app.service.UD17Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UD17ServiceImpl implements UD17Service {

    private static final Logger logger = LoggerFactory.getLogger(UD17ServiceImpl.class);

    @Autowired
    private UD17Mapper ud17Mapper;

    @Override
    public List<Map<String, String>> getMarkets() {
        return ud17Mapper.selectAllMarkets();
    }

    @Override
    public Map<String, Object> processUserAdmin(UD17Request request) {
        String userid = request.getUserid().trim();
        switch (request.getOperation()) {
            case "userinfo":
                return handleUserInfo(userid);
            case "updateRole":
                return handleUpdateRole(userid, request);
            case "deleteRole":
                return handleDeleteRole(userid, request);
            default:
                throw new IllegalArgumentException("Unknown operation: " + request.getOperation());
        }
    }

    private Map<String, Object> handleUserInfo(String userid) {
        Map<String, Object> result = new LinkedHashMap<>();
        // 查询用户名
        String username = ud17Mapper.selectUsername(userid);
        result.put("username", username != null ? username : "");

        // 查询功能权限
        List<Map<String, Object>> functions = ud17Mapper.selectFunctionAuth(userid);
        result.put("functions", functions);

        // 查询市场权限
        List<Map<String, Object>> markets = ud17Mapper.selectMarketAuth(userid);
        result.put("markets", markets);

        return result;
    }

    private Map<String, Object> handleUpdateRole(String userid, UD17Request request) {
        Map<String, Object> result = new LinkedHashMap<>();
        // 检查用户是否存在
        String username = ud17Mapper.selectUsername(userid);
        if (username == null) {
            result.put("success", false);
            result.put("message", "We didn't recognize the userid you entered. Please try again.");
            return result;
        }

        // 更新市场权限
        if (request.getMarkets() != null) {
            for (Map<String, String> market : request.getMarkets()) {
                ud17Mapper.updateMarketAuth(userid, market.get("market"), market.get("type"),
                        market.get("bu"), request.getUpdateUser(), request.getUpdateProcess());
            }
        }

        // 更新功能权限
        if (request.getFunctions() != null) {
            for (String func : request.getFunctions()) {
                ud17Mapper.updateFunctionAuth(func, userid, request.getUpdateUser(), request.getUpdateProcess());
            }
        }

        result.put("success", true);
        result.put("message", "Role updated successfully.");
        return result;
    }

    private Map<String, Object> handleDeleteRole(String userid, UD17Request request) {
        // 删除市场权限
        if (request.getMarkets() != null) {
            for (Map<String, String> market : request.getMarkets()) {
                ud17Mapper.deleteMarketAuth(userid, market.get("market"), market.get("type"), market.get("bu"));
            }
        }
        // 删除功能权限
        if (request.getFunctions() != null) {
            for (String func : request.getFunctions()) {
                ud17Mapper.deleteFunctionAuth(func, userid);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Role deleted successfully.");
        return result;
    }
}
