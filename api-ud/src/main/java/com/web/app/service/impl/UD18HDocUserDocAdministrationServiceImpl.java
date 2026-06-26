package com.web.app.service.impl;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.entity.HdocUserDoc;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.mapper.UserDocumentPermissionMapper;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD18 - HDoc User Doc Administration服务实现类
 */
@Service
public class UD18HDocUserDocAdministrationServiceImpl implements UD18HDocUserDocAdministrationService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Autowired
    private UserDocumentPermissionMapper userDocumentPermissionMapper;

    @Override
    public UD18HDocUserDocAdministrationResponse getDocumentList() {
        List<HdocDocumentList> documents = hdocDocumentListMapper.selectAllDocumentTypes();

        Map<String, Object> data = new HashMap<>();
        data.put("documents", documents);

        UD18HDocUserDocAdministrationResponse response = new UD18HDocUserDocAdministrationResponse();
        response.setCode(200);
        response.setMsg("获取成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD18HDocUserDocAdministrationResponse selectUserDoc(UD18HDocUserDocAdministrationRequest request) {
        UD18HDocUserDocAdministrationResponse response = new UD18HDocUserDocAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("用户ID不能为空");
            return response;
        }

        // 1. 检索HDOC_FUNCTION_AUTH是否存在该用户（去重）
        String foundUserId = userDocumentPermissionMapper.selectUserIdFromFunctionAuth(request.getUserid());
        if (foundUserId == null) {
            response.setCode(404);
            response.setMsg("We didn't recognize the userid you entered. Please try again.");
            return response;
        }

        // 2. 存在的场合：查询HDOC_USER_DOC取得该用户的DOCTYPE列表
        List<String> doctypes = userDocumentPermissionMapper.selectUserDocDoctypes(request.getUserid());

        // 3. 返回结果（去重后的userid + doctype列表）
        Map<String, Object> data = new HashMap<>();
        data.put("userid", foundUserId);
        data.put("doctypes", doctypes != null ? doctypes : List.of());

        response.setCode(200);
        response.setMsg("获取成功");
        response.setData(data);
        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD18HDocUserDocAdministrationResponse updateUserDoc(UD18HDocUserDocAdministrationRequest request) {
        UD18HDocUserDocAdministrationResponse response = new UD18HDocUserDocAdministrationResponse();

        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("用户ID不能为空");
            return response;
        }

        // 删除原有权限
        userDocumentPermissionMapper.deleteUserDoc(request.getUserid());

        // 插入新权限
        if (request.getDocuments() != null) {
            for (Map<String, String> doc : request.getDocuments()) {
                HdocUserDoc userDoc = new HdocUserDoc();
                userDoc.setUserid(request.getUserid());
                userDoc.setDoctype(doc.get("doctype"));
                userDoc.setRegisterUser(request.getUserid());
                userDocumentPermissionMapper.insertUserDoc(userDoc);
            }
        }

        response.setCode(200);
        response.setMsg("更新成功");
        return response;
    }
}
