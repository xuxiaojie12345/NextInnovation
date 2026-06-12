package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.mapper.UserDocumentPermissionMapper;
import com.web.app.entity.HdocUserDoc;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD18 HDoc用户文档管理API控制器
 */
@RestController
@RequestMapping("/api/UD18HDocUserDocAdministrationApi")
@Api(tags = "UD18-HDoc用户文档管理API")
public class UD18HDocUserDocAdministrationController {
    
    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;
    
    @Autowired
    private UserDocumentPermissionMapper userDocumentPermissionMapper;
    
    @GetMapping("/document-list")
    @ApiOperation("获取文档列表")
    public CommonResponse getDocumentList() {
        List<Map<String, Object>> documents = hdocDocumentListMapper.selectAllDocumentTypes()
            .stream()
            .map(doc -> {
                Map<String, Object> map = new HashMap<>();
                map.put("doctype", doc.getDoctype());
                map.put("description", doc.getDescription());
                return map;
            })
            .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("documents", documents);
        
        return CommonResponse.success(data);
    }
    
    @PostMapping("/select-user-doc")
    @ApiOperation("查询用户文档权限")
    public CommonResponse selectUserDoc(@RequestBody Map<String, String> params) {
        String userid = params.get("userid");
        
        // 检查用户是否存在（这里简化处理）
        List<Map<String, Object>> documents = userDocumentPermissionMapper.selectUserDocPermissions(userid);
        
        Map<String, Object> data = new HashMap<>();
        data.put("documents", documents);
        
        return CommonResponse.success(data);
    }
    
    @PostMapping("/update-user-doc")
    @ApiOperation("更新用户文档权限")
    public CommonResponse updateUserDoc(@RequestBody Map<String, Object> params) {
        String userid = (String) params.get("userid");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> documents = (List<Map<String, String>>) params.get("documents");
        
        // 删除原有权限
        userDocumentPermissionMapper.deleteUserDoc(userid);
        
        // 插入新权限
        for (Map<String, String> doc : documents) {
            HdocUserDoc userDoc = new HdocUserDoc();
            userDoc.setUserid(userid);
            userDoc.setDoctype(doc.get("doctype"));
            userDoc.setRegisterUser(userid);
            userDocumentPermissionMapper.insertUserDoc(userDoc);
        }
        
        return CommonResponse.success("更新成功", null);
    }
}
