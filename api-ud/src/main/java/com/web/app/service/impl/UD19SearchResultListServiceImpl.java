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

    @Override
    public UD19SearchResultListResponse searchHdoc(UD19SearchResultListRequest request) {
        UD19SearchResultListResponse response = new UD19SearchResultListResponse();

        // 参数校验
        if (request.getUserid() == null && request.getUser() == null
                && request.getNotSet() == null && request.getRule() == null && request.getTemplate() == null) {
            response.setCode(400);
            response.setMsg("请至少输入一个搜索条件");
            return response;
        }

        // 查询用户及市场权限信息
        List<Map<String, Object>> users = userPermissionMapper.selectUserPermissions(request.getUserid());

        Map<String, Object> data = new HashMap<>();
        data.put("users", users);
        data.put("count", users != null ? users.size() : 0);

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }
}
