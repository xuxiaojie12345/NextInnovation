package com.web.app.service.impl;

import com.web.app.domain.UD17Request;
import com.web.app.mapper.UD17Mapper;
import com.web.app.service.UD17Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
/**

 * UD17ServiceImpl

 */

public class UD17ServiceImpl implements UD17Service {

    @Autowired
    /** ud17Mapper */

    private UD17Mapper ud17Mapper;

    @Override
    /**

     * getMarkets

     */

    public List<Map<String, String>> getMarkets() {
        return ud17Mapper.selectAllMarkets();
    }

    @Override
    /**

     * processUserAdmin

     */

    public Map<String, Object> processUserAdmin(UD17Request request) {
        String userid = request.getUserid().trim();
        switch (request.getOperation()) {
            case "userinfo":
                return handleUserInfo(userid);
            case "updateRole":
                return handleUpdateRole(userid, request);
            case "deleteRole":
                return handleDeleteRole(userid);
            default:
                throw new IllegalArgumentException("Unknown operation: " + request.getOperation());
        }
    }

    /**
     * User Info处理
     * 查询用户名（HDOC_USER_INFOR），以及功能权限（HDOC_FUNCTION_AUTH）和市场权限（DOC_MARKET_AUTH）
     */
     /**

      * handleUserInfo

      */

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

    /**
     * Update Role处理
     * 先删除既存数据，后追加新的数据（DELETE + INSERT）
     */
     /**

      * handleUpdateRole

      */

    private Map<String, Object> handleUpdateRole(String userid, UD17Request request) {
        Map<String, Object> result = new LinkedHashMap<>();
        // 检查用户是否存在
        String username = ud17Mapper.selectUsername(userid);
        if (username == null) {
            result.put("success", false);
            result.put("message", "We didn't recognize the userid you entered. Please try again.");
            return result;
        }

        // 1. 先删除该用户的全部既有权限
        ud17Mapper.deleteAllFunctionAuth(userid);
        ud17Mapper.deleteAllMarketAuth(userid);

        // 2. 再追加新的功能权限记录
        if (request.getFunctions() != null) {
            for (String func : request.getFunctions()) {
                ud17Mapper.insertFunctionAuth(func, userid,
                        request.getUpdateUser(), request.getUpdateProcess());
            }
        }

        // 3. 再追加新的市场权限记录
        if (request.getMarkets() != null) {
            for (Map<String, String> market : request.getMarkets()) {
                ud17Mapper.insertMarketAuth(userid, market.get("market"), market.get("type"),
                        market.get("bu"), request.getUpdateUser(), request.getUpdateProcess());
            }
        }

        result.put("success", true);
        result.put("message", "Role updated successfully.");
        return result;
    }

    /**
     * Delete Role处理
     * 根据userid删除该用户的所有权限（DOC_MARKET_AUTH, HDOC_FUNCTION_AUTH）
     */
     /**

      * handleDeleteRole

      */

    private Map<String, Object> handleDeleteRole(String userid) {
        // 删除该用户的所有市场权限
        ud17Mapper.deleteAllMarketAuth(userid);
        // 删除该用户的所有功能权限
        ud17Mapper.deleteAllFunctionAuth(userid);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Role deleted successfully.");
        return result;
    }
}
