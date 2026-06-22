package com.web.app.service.impl;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.mapper.UserMapper;
import com.web.app.mapper.UserPermissionMapper;
import com.web.app.service.UD17HDocUserAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD17 - HDoc User Administration服务实现类
 */
@Service
public class UD17HDocUserAdministrationServiceImpl implements UD17HDocUserAdministrationService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserPermissionMapper userPermissionMapper;

    @Override
    public UD17HDocUserAdministrationResponse getUserInfo(UD17HDocUserAdministrationRequest request) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("用户ID不能为空");
            return response;
        }

        // 检查用户是否存在
        int count = userPermissionMapper.countByUserId(request.getUserid());
        if (count == 0) {
            response.setCode(404);
            response.setMsg("We didn't recognize the userid you entered. Please try again.");
            return response;
        }

        // 查询用户权限
        List<Map<String, Object>> permissions = userPermissionMapper.selectUserPermissions(request.getUserid());

        Map<String, Object> data = new HashMap<>();
        data.put("permissions", permissions);

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD17HDocUserAdministrationResponse updateRole(UD17HDocUserAdministrationRequest request) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("用户ID不能为空");
            return response;
        }

        // 检查用户是否存在
        int count = userPermissionMapper.countByUserId(request.getUserid());
        if (count == 0) {
            response.setCode(404);
            response.setMsg("We didn't recognize the userid you entered. Please try again.");
            return response;
        }

        // 更新权限
        if (request.getPermissions() != null) {
            for (String permission : request.getPermissions()) {
                userPermissionMapper.updateFunctionAuth(request.getUserid(), permission);
            }
        }

        response.setCode(200);
        response.setMsg("更新成功");
        return response;
    }

    @Override
    public UD17HDocUserAdministrationResponse deleteRole(UD17HDocUserAdministrationRequest request) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("用户ID不能为空");
            return response;
        }

        // 清空权限
        userPermissionMapper.clearFunctionAuth(request.getUserid());
        userPermissionMapper.clearMarketAuth(request.getUserid());

        response.setCode(200);
        response.setMsg("删除成功");
        return response;
    }
}
