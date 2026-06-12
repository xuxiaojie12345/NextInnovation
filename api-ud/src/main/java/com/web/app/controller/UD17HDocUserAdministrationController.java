package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.UserPermissionMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD17 HDoc用户管理API控制器
 */
@RestController
@RequestMapping("/api/UD17HDocUserAdministrationApi")
@Api(tags = "UD17-HDoc用户管理API")
public class UD17HDocUserAdministrationController {
    
    @Autowired
    private UserPermissionMapper userPermissionMapper;
    
    @PostMapping("/UD17Userinfo")
    @ApiOperation("查询用户信息")
    public CommonResponse userinfo(@RequestBody Map<String, String> params) {
        String userid = params.get("userid");
        
        // 检查用户是否存在
        int count = userPermissionMapper.countByUserId(userid);
        if (count == 0) {
            return CommonResponse.error("We didn't recognize the userid you entered. Please try again.");
        }
        
        List<Map<String, Object>> permissions = userPermissionMapper.selectUserPermissions(userid);
        
        Map<String, Object> data = new HashMap<>();
        data.put("userid", userid);
        data.put("permissions", permissions);
        
        return CommonResponse.success(data);
    }
    
    @PostMapping("/UD17UpdateRole")
    @ApiOperation("更新用户角色")
    public CommonResponse updateRole(@RequestBody Map<String, Object> params) {
        String userid = (String) params.get("userid");
        String permissions = (String) params.get("permissions");
        
        // 检查用户是否存在
        int count = userPermissionMapper.countByUserId(userid);
        if (count == 0) {
            return CommonResponse.error("We didn't recognize the userid you entered. Please try again.");
        }
        
        userPermissionMapper.updateFunctionAuth(userid, permissions);
        
        return CommonResponse.success("更新成功", null);
    }
    
    @PostMapping("/UD17DeleteRole")
    @ApiOperation("删除用户角色")
    public CommonResponse deleteRole(@RequestBody Map<String, String> params) {
        String userid = params.get("userid");
        
        userPermissionMapper.clearFunctionAuth(userid);
        userPermissionMapper.clearMarketAuth(userid);
        
        return CommonResponse.success("删除成功", null);
    }
}
