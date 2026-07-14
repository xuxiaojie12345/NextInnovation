package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD19Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * UD19 Service Implementation
 * 实现HDoc用户搜索的业务逻辑
 */
@Service
public class UD19ServiceImpl implements UD19Service {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public ApiResponse<?> getMarketList() {

        try {
            List<MarketMaster> marketList = hdocDocumentListMapper.selectMarketList();

            if (marketList == null || marketList.isEmpty()) {
                return ApiResponse.error(404, "市场列表为空");
            }

            return ApiResponse.success("获取市场列表成功", marketList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> searchHdoc(HdocDocumentList request) {

        try {
            String userid = request.getUserId() != null ? request.getUserId().trim() : "";
            String searchUser = request.getSearchUser() != null ? request.getSearchUser().trim() : "";
            String market = request.getMarket() != null ? request.getMarket().trim() : "";
            String searchType = request.getSearchType() != null ? request.getSearchType().trim().toUpperCase() : "";

            // 参数校验
            if (userid.length() > 10) {
                return ApiResponse.error(400, "Userid长度不能超过10字符");
            }
            if (searchUser.length() > 32) {
                return ApiResponse.error(400, "User长度不能超过32字符");
            }

            // 确定搜索用的functionCode和查询参数
            String functionCode = null;
            String queryUserid = null;
            String queryUsername = null;

            if (userid.isEmpty() && searchUser.isEmpty()) {
                // Not set / Rule / Template 搜索
                if ("RULE".equals(searchType)) {
                    functionCode = "RULES";
                } else if ("TEMPLATE".equals(searchType)) {
                    functionCode = "TEMPLATE";
                }
                // NOT_SET: functionCode remains null → 查询所有
            } else if (!userid.isEmpty()) {
                // 按UserId搜索
                queryUserid = userid;
                functionCode = resolveFunctionCode(searchType);
            } else if (!searchUser.isEmpty()) {
                // 按UserName搜索
                queryUsername = searchUser;
                functionCode = resolveFunctionCode(searchType);
            }

            // 执行搜索
            List<Map<String, Object>> rawResults = hdocDocumentListMapper.searchUsers(
                    queryUserid, queryUsername, functionCode,
                    market.isEmpty() ? null : market);

            // 转换为前端需要的格式
            List<Map<String, Object>> users = new ArrayList<>();
            if (rawResults != null) {
                for (Map<String, Object> row : rawResults) {
                    Map<String, Object> user = new HashMap<>();
                    user.put("userid", row.get("userid"));
                    user.put("user", row.get("user"));
                    user.put("market", row.get("market") != null ? row.get("market") : "");
                    users.add(user);
                }
            }

            // 构建返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("count", users.size());
            data.put("users", users);

            return ApiResponse.success("success", data);

        } catch (Exception e) {

            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 将前端SearchType转换为FUNCTION_AUTH的FUNCTION值
     */
    private String resolveFunctionCode(String searchType) {
        if (searchType == null) return null;
        switch (searchType.toUpperCase()) {
            case "RULE":
                return "RULES";
            case "TEMPLATE":
                return "TEMPLATE";
            default:
                return null;
        }
    }
}
