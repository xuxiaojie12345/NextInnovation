package com.web.app.service.impl;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;
import com.web.app.mapper.UserMapper;
import com.web.app.mapper.UserPermissionMapper;
import com.web.app.service.UD19SearchResultListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD19 - Search Result List服务实现类
 */
@Service
public class UD19SearchResultListServiceImpl implements UD19SearchResultListService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserPermissionMapper userPermissionMapper;

    @Autowired
    private com.web.app.mapper.MarketMasterMapper marketMasterMapper;

    @Override
    public UD19SearchResultListResponse searchHdoc(UD19SearchResultListRequest request) {
        UD19SearchResultListResponse response = new UD19SearchResultListResponse();

        // 参数校验
        boolean hasUserid = request.getUserid() != null && !request.getUserid().trim().isEmpty();
        boolean hasUser = request.getUser() != null && !request.getUser().trim().isEmpty();
        boolean hasNotSet = request.getNotSet() != null;
        boolean hasRule = request.getRule() != null;
        boolean hasTemplate = request.getTemplate() != null;
        java.util.List<String> markets = request.getMarkets();
        boolean hasMarkets = markets != null && !markets.isEmpty();

        if (!hasUserid && !hasUser && !hasNotSet && !hasRule && !hasTemplate && !hasMarkets) {
            response.setCode(400);
            response.setMsg("请至少输入一个搜索条件");
            return response;
        }

        // 确定搜索用的function参数（支持组合检索）
        String function = null;
        if (hasNotSet) {
            function = null;
        }
        if (hasRule) {
            function = "Rule Admin";
        }
        if (hasTemplate) {
            function = "Template Admin";
        }
        // 多个条件可组合，后选的覆盖 function（若同时选了 Rule + Template 则取 Template）

        // 查询用户及市场信息
        List<Map<String, Object>> users = userPermissionMapper.searchHdocUsers(
            hasUserid ? request.getUserid().trim() : null,
            hasUser ? request.getUser().trim() : null,
            function,
            hasMarkets ? markets : null
        );

        Map<String, Object> data = new HashMap<>();
        data.put("users", users);
        data.put("count", users != null ? users.size() : 0);

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD19SearchResultListResponse selectMarketMaster() {
        UD19SearchResultListResponse response = new UD19SearchResultListResponse();

        List<com.web.app.entity.MarketMaster> markets = marketMasterMapper.selectAll();

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("markets", markets != null ? markets : java.util.List.of());

        response.setCode(200);
        response.setMsg("获取成功");
        response.setData(data);
        return response;
    }
}
