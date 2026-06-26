package com.web.app.service.impl;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationRequest.PermissionItem;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
import com.web.app.entity.User;
import com.web.app.mapper.UserPermissionMapper;
import com.web.app.service.UD17HDocUserAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD17 - HDoc User Administration服务实现类
 */
@Service
public class UD17HDocUserAdministrationServiceImpl implements UD17HDocUserAdministrationService {

    @Autowired
    private UserPermissionMapper userPermissionMapper;

    @Override
    public UD17HDocUserAdministrationResponse getUserInfo(UD17HDocUserAdministrationRequest request) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("请输入用户ID");
            return response;
        }

        // 1. 查询用户信息
        User user = userPermissionMapper.selectUserInfo(request.getUserid());
        if (user == null) {
            response.setCode(404);
            response.setMsg("We didn't recognize the userid you entered. Please try again.");
            return response;
        }

        // 2. 查询功能权限
        List<HdocFunctionAuth> functions = userPermissionMapper.selectFunctionAuthByUserId(request.getUserid());

        // 3. 查询市场权限（含子查询过滤）
        List<HdocMarketAuth> markets = userPermissionMapper.selectMarketAuthByUserId(request.getUserid());

        // 4. 组装权限列表
        List<Map<String, Object>> permissionList = new ArrayList<>();
        for (HdocFunctionAuth fa : functions) {
            Map<String, Object> perm = new HashMap<>();
            perm.put("role", fa.getFunction());
            List<String> marketList = new ArrayList<>();
            for (HdocMarketAuth ma : markets) {
                if (ma.getType() != null && ma.getType().equals(fa.getFunction())) {
                    marketList.add(ma.getMarket());
                }
            }
            perm.put("markets", marketList);
            permissionList.add(perm);
        }

        // 5. 组装返回数据
        Map<String, Object> data = new HashMap<>();
        data.put("username", user.getUsername());
        data.put("permissions", permissionList);

        response.setCode(200);
        response.setMsg("获取成功");
        response.setData(data);
        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD17HDocUserAdministrationResponse updateRole(UD17HDocUserAdministrationRequest request) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("请输入用户ID");
            return response;
        }

        // 检查用户是否存在
        int count = userPermissionMapper.countByUserId(request.getUserid());
        if (count == 0) {
            response.setCode(404);
            response.setMsg("We didn't recognize the userid you entered. Please try again.");
            return response;
        }

        String updateUser = request.getUserid();

        // 先删除用户现有权限
        userPermissionMapper.deleteFunctionAuthByUser(request.getUserid());
        userPermissionMapper.deleteMarketAuthByUser(request.getUserid());

        // 再插入新权限
        if (request.getPermissions() != null) {
            for (PermissionItem item : request.getPermissions()) {
                if (item.getRole() == null || item.getRole().trim().isEmpty()) {
                    continue;
                }
                // 插入功能权限
                userPermissionMapper.insertFunctionAuth(item.getRole(), request.getUserid(), updateUser);

                // 插入市场权限（BU固定为'UD'）
                if (item.getMarkets() != null) {
                    for (String market : item.getMarkets()) {
                        if (market != null && !market.trim().isEmpty()) {
                            userPermissionMapper.insertMarketAuth(
                                request.getUserid(), market.trim(),
                                item.getRole(), updateUser);
                        }
                    }
                }
            }
        }

        response.setCode(200);
        response.setMsg("权限更新成功");
        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD17HDocUserAdministrationResponse deleteRole(UD17HDocUserAdministrationRequest request) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("请输入用户ID");
            return response;
        }

        // 删除用户所有权限
        userPermissionMapper.deleteFunctionAuthByUser(request.getUserid());
        userPermissionMapper.deleteMarketAuthByUser(request.getUserid());

        response.setCode(200);
        response.setMsg("权限删除成功");
        return response;
    }
}
