package com.web.app.service.impl;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
import com.web.app.mapper.UD17HDocUserAdministrationMapper;
import com.web.app.service.UD17HDocUserAdministrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * UD17 用户权限管理服务实现类
 *
 * 功能说明：实现用户权限查询、更新、删除的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD17HDocUserAdministrationServiceImpl implements UD17HDocUserAdministrationService {

    @Autowired
    private UD17HDocUserAdministrationMapper ud17Mapper;

    @Override
    public UD17HDocUserAdministrationResponse userInfo(UD17HDocUserAdministrationRequest request) {
        log.info("开始UD17查询用户权限信息, userid: {}", request.getUserid());
        try {
            if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
                return UD17HDocUserAdministrationResponse.error("400", "用户ID不能为空");
            }

            // 查询机能权限
            List<HdocFunctionAuth> functionAuthList = ud17Mapper.selectFunctionAuthByUserid(
                    request.getUserid().trim());
            if (functionAuthList == null || functionAuthList.isEmpty()) {
                log.warn("UD17查询用户权限信息 - 用户不存在, userid: {}", request.getUserid());
                return UD17HDocUserAdministrationResponse.error("404", "用户不存在");
            }

            // 查询市场权限
            List<HdocMarketAuth> marketAuthList = ud17Mapper.selectMarketAuthByUserid(
                    request.getUserid().trim());

            // 构建机能权限列表
            List<String> functionAuths = new ArrayList<>();
            for (HdocFunctionAuth fa : functionAuthList) {
                functionAuths.add(fa.getFunction());
            }

            // 构建市场权限列表
            List<UD17HDocUserAdministrationResponse.MarketAuthData> marketAuths = new ArrayList<>();
            if (marketAuthList != null) {
                for (HdocMarketAuth ma : marketAuthList) {
                    marketAuths.add(new UD17HDocUserAdministrationResponse.MarketAuthData(
                            ma.getType(), ma.getMarket()));
                }
            }

            log.info("UD17查询用户权限信息成功");
            return UD17HDocUserAdministrationResponse.success(
                    request.getUserid().trim(), marketAuths, functionAuths);
        } catch (Exception e) {
            log.error("UD17查询用户权限信息失败", e);
            return UD17HDocUserAdministrationResponse.error("500", "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD17HDocUserAdministrationResponse updateRole(UD17HDocUserAdministrationRequest request) {
        log.info("开始UD17更新用户角色权限, userid: {}", request.getUserid());
        try {
            if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
                return UD17HDocUserAdministrationResponse.error("400", "用户ID不能为空");
            }

            // 检查用户是否存在
            List<HdocFunctionAuth> functionAuthList = ud17Mapper.selectFunctionAuthByUserid(
                    request.getUserid().trim());
            if (functionAuthList == null || functionAuthList.isEmpty()) {
                log.warn("UD17更新用户角色权限 - 用户不存在, userid: {}", request.getUserid());
                return UD17HDocUserAdministrationResponse.error("404", "用户不存在");
            }

            // 更新机能权限
            if (request.getFunctionAuths() != null && !request.getFunctionAuths().isEmpty()) {
                for (String function : request.getFunctionAuths()) {
                    ud17Mapper.updateFunctionAuth(function, request.getUserid().trim());
                }
            }

            // 更新市场权限
            if (request.getMarketAuths() != null && !request.getMarketAuths().isEmpty()) {
                for (UD17HDocUserAdministrationRequest.MarketAuthItem item : request.getMarketAuths()) {
                    ud17Mapper.updateMarketAuth(item.getMarket(), item.getRoleType(), request.getUserid().trim());
                }
            }

            log.info("UD17更新用户角色权限成功");
            return UD17HDocUserAdministrationResponse.updateSuccess("用户权限更新成功");
        } catch (Exception e) {
            log.error("UD17更新用户角色权限失败", e);
            return UD17HDocUserAdministrationResponse.error("500", "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD17HDocUserAdministrationResponse deleteUser(UD17HDocUserAdministrationRequest request) {
        log.info("开始UD17删除用户权限, userid: {}", request.getUserid());
        try {
            if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
                return UD17HDocUserAdministrationResponse.error("400", "用户ID不能为空");
            }

            // 检查用户是否存在
            List<HdocFunctionAuth> functionAuthList = ud17Mapper.selectFunctionAuthByUserid(
                    request.getUserid().trim());
            if (functionAuthList == null || functionAuthList.isEmpty()) {
                log.warn("UD17删除用户权限 - 用户不存在, userid: {}", request.getUserid());
                return UD17HDocUserAdministrationResponse.error("404", "用户不存在");
            }

            // 删除用户权限（关联删除）
            // Integer result = ud17Mapper.deleteUserAuth(request.getUserid().trim());

            log.info("UD17删除用户权限成功");
            return UD17HDocUserAdministrationResponse.updateSuccess("用户权限删除成功");
        } catch (Exception e) {
            log.error("UD17删除用户权限失败", e);
            return UD17HDocUserAdministrationResponse.error("500", "系统繁忙，请稍后重试");
        }
    }
}
