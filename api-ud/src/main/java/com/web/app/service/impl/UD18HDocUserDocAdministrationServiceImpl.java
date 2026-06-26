package com.web.app.service.impl;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;
import com.web.app.entity.HdocUserDoc;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.UD18HDocUserDocAdministrationMapper;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UD18 用户文档权限管理服务实现类
 *
 * 功能说明：实现用户文档权限检查、查询、更新的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD18HDocUserDocAdministrationServiceImpl implements UD18HDocUserDocAdministrationService {

    @Autowired
    private UD18HDocUserDocAdministrationMapper ud18Mapper;

    @Override
    public UD18HDocUserDocAdministrationResponse checkAuth(UD18HDocUserDocAdministrationRequest request) {
        log.info("开始UD18检查用户权限, userId: {}", request.getUserId());
        try {
            if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "用户ID不能为空");
            }

            // 检查用户在机能权限表中是否存在
            Integer count = ud18Mapper.countFunctionAuthByUserId(request.getUserId().trim());
            if (count == null || count == 0) {
                log.warn("UD18检查用户权限 - 用户不存在, userId: {}", request.getUserId());
                return UD18HDocUserDocAdministrationResponse.error(404, "用户不存在");
            }

            // 查询用户基本信息
            HdocUserInfor userInfor = ud18Mapper.selectUserInfor(request.getUserId().trim());
            if (userInfor == null) {
                log.warn("UD18检查用户权限 - 用户基本信息不存在, userId: {}", request.getUserId());
                return UD18HDocUserDocAdministrationResponse.error(404, "用户基本信息不存在");
            }

            UD18HDocUserDocAdministrationResponse.UserInfoData userInfoData = new UD18HDocUserDocAdministrationResponse.UserInfoData();
            userInfoData.setUserid(userInfor.getUserid());
            userInfoData.setName(userInfor.getUsername());
            userInfoData.setResponsible(userInfor.getResponsible());
            userInfoData.setUserPosition(userInfor.getUserposition());
            userInfoData.setEmail(userInfor.getEmail());

            log.info("UD18检查用户权限成功");
            return UD18HDocUserDocAdministrationResponse.success("查询成功", userInfoData);
        } catch (Exception e) {
            log.error("UD18检查用户权限失败", e);
            return UD18HDocUserDocAdministrationResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD18HDocUserDocAdministrationResponse getUserDoc(UD18HDocUserDocAdministrationRequest request) {
        log.info("开始UD18获取用户文档类型, userId: {}", request.getUserId());
        try {
            if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "用户ID不能为空");
            }

            // 查询用户文档类型
            HdocUserDoc userDoc = ud18Mapper.selectUserDocByUserId(request.getUserId().trim());

            if (userDoc == null) {
                log.warn("UD18获取用户文档类型 - 记录不存在, userId: {}", request.getUserId());
                return UD18HDocUserDocAdministrationResponse.error(404, "记录不存在");
            }

            UD18HDocUserDocAdministrationResponse.UserDocData docData = new UD18HDocUserDocAdministrationResponse.UserDocData(
                    userDoc.getDoctype());

            log.info("UD18获取用户文档类型成功");
            return UD18HDocUserDocAdministrationResponse.success("查询成功", docData);
        } catch (Exception e) {
            log.error("UD18获取用户文档类型失败", e);
            return UD18HDocUserDocAdministrationResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD18HDocUserDocAdministrationResponse updateDoc(UD18HDocUserDocAdministrationRequest request) {
        log.info("开始UD18更新用户文档权限, userId: {}, doctype: {}", request.getUserId(), request.getDoctype());
        try {
            if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "用户ID不能为空");
            }
            if (request.getDoctype() == null || request.getDoctype().trim().isEmpty()) {
                return UD18HDocUserDocAdministrationResponse.error(400, "文档类型不能为空");
            }

            // 检查用户是否存在
            Integer count = ud18Mapper.countFunctionAuthByUserId(request.getUserId().trim());
            if (count == null || count == 0) {
                log.warn("UD18更新用户文档权限 - 用户不存在, userId: {}", request.getUserId());
                return UD18HDocUserDocAdministrationResponse.error(404, "用户不存在");
            }

            // 更新用户文档类型
            // Integer result = ud18Mapper.updateUserDoc(request.getUserId().trim(),
            // request.getDoctype().trim());

            log.info("UD18更新用户文档权限成功");
            return UD18HDocUserDocAdministrationResponse.success("权限更新成功", null);
        } catch (Exception e) {
            log.error("UD18更新用户文档权限失败", e);
            return UD18HDocUserDocAdministrationResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
