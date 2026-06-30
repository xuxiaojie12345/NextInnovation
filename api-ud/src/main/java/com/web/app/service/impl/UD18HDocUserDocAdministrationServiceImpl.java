package com.web.app.service.impl;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;
import com.web.app.mapper.UD18HDocUserDocAdministrationMapper;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD18 用户文档权限管理服务实现类
 *
 * 功能说明：实现用户文档权限检查、查询、新增、删除的业务逻辑
 * 对应全体API設計：UD18HDocUserDocAdministrationApi
 * - 4.1 checkauth: 检查HDOC_FUNCTION_AUTH表中是否存在该用户
 * - 4.2 getuserdoc: 查询HDOC_USER_DOC表中的用户文档权限
 * - 4.3 createdoc: 插入HDOC_USER_DOC表（对应5.38.1）
 * - 4.4 deleteedoc: 删除HDOC_USER_DOC表（对应5.38.2）
 *
 * @author GitHub Copilot
 * @version 2.0
 * @date 2026-06-30
 */
@Slf4j
@Service
public class UD18HDocUserDocAdministrationServiceImpl implements UD18HDocUserDocAdministrationService {

    @Autowired
    private UD18HDocUserDocAdministrationMapper ud18Mapper;

    private static final String REGISTER_PROCESS = "HDoc User Doc Administration";
    private static final String UPDATE_PROCESS = "HDoc User Doc Administration";

    @Override
    public UD18HDocUserDocAdministrationResponse checkAuth(UD18HDocUserDocAdministrationRequest request) {
        log.info("开始UD18检查用户权限, userId: {}", request.getUserId());
        try {
            if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "用户ID不能为空");
            }
            String userId = request.getUserId().trim();

            // 对应5.36: 检查用户是否在HDOC_FUNCTION_AUTH表中存在
            Integer count = ud18Mapper.countFunctionAuthByUserId(userId);
            boolean exists = count != null && count > 0;

            Map<String, Object> data = new HashMap<>();
            data.put("exists", exists);

            log.info("UD18检查用户权限成功, exists: {}", exists);
            return UD18HDocUserDocAdministrationResponse.success("success", data);
        } catch (Exception e) {
            log.error("UD18检查用户权限失败", e);
            return UD18HDocUserDocAdministrationResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD18HDocUserDocAdministrationResponse getUserDoc(UD18HDocUserDocAdministrationRequest request) {
        log.info("开始UD18获取用户文档类型, userId: {}, doctype: {}", request.getUserId(), request.getDoctype());
        try {
            if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "用户ID不能为空");
            }
            String userId = request.getUserId().trim();
            String doctype = request.getDoctype() != null ? request.getDoctype().trim() : null;

            // 对应5.37: 查询用户文档类型（doctype可选参数）
            // 返回用户所有文档权限列表，前端支持多选高亮
            List<Map<String, Object>> docList = ud18Mapper.selectUserDocByUserId(userId, doctype);

            // 提取所有doctype为数组返回给前端
            List<String> doctypeList = new ArrayList<>();
            if (docList != null) {
                for (Map<String, Object> doc : docList) {
                    Object dt = doc.get("doctype");
                    if (dt != null) {
                        doctypeList.add(dt.toString());
                    }
                }
            }

            Map<String, Object> resultData = new HashMap<>();
            resultData.put("doctypes", doctypeList);

            log.info("UD18获取用户文档类型成功, 数量: {}", doctypeList.size());
            return UD18HDocUserDocAdministrationResponse.success("查询成功", resultData);
        } catch (Exception e) {
            log.error("UD18获取用户文档类型失败", e);
            return UD18HDocUserDocAdministrationResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD18HDocUserDocAdministrationResponse createDoc(UD18HDocUserDocAdministrationRequest request) {
        log.info("开始UD18新增用户文档权限, userId: {}, doctype: {}", request.getUserId(), request.getDoctype());
        try {
            if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "用户ID不能为空");
            }
            if (request.getDoctype() == null || request.getDoctype().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "文档类型不能为空");
            }
            String userId = request.getUserId().trim();
            String doctype = request.getDoctype().trim();

            // 对应5.38.1: 插入HDOC_USER_DOC表
            ud18Mapper.insertUserDoc(userId, doctype, userId, REGISTER_PROCESS, userId, UPDATE_PROCESS);

            log.info("UD18新增用户文档权限成功");
            return UD18HDocUserDocAdministrationResponse.success("权限插入成功", null);
        } catch (Exception e) {
            log.error("UD18新增用户文档权限失败", e);
            return UD18HDocUserDocAdministrationResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD18HDocUserDocAdministrationResponse deleteDoc(UD18HDocUserDocAdministrationRequest request) {
        log.info("开始UD18删除用户文档权限, userId: {}, doctype: {}", request.getUserId(), request.getDoctype());
        try {
            if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "用户ID不能为空");
            }
            if (request.getDoctype() == null || request.getDoctype().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "文档类型不能为空");
            }
            String userId = request.getUserId().trim();
            String doctype = request.getDoctype().trim();

            // 对应5.38.2: 从HDOC_USER_DOC表删除
            ud18Mapper.deleteUserDoc(userId, doctype);

            log.info("UD18删除用户文档权限成功");
            return UD18HDocUserDocAdministrationResponse.success("权限删除成功", null);
        } catch (Exception e) {
            log.error("UD18删除用户文档权限失败", e);
            return UD18HDocUserDocAdministrationResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
